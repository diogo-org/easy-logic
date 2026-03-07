#!/usr/bin/env node
/**
 * test-simplify.cjs
 *
 * Simplifies the test suite by removing redundant tests.
 *
 * Algorithm: per-file pairwise subsumption.
 *
 *   1. Find all test files (*.test.ts / *.test.tsx)
 *   2. For each file, parse test names via AST
 *   3. Collect per-test coverage fingerprints (isolate each test with .only)
 *   4. Per file: if test A's coverage ⊆ test B's → A is redundant
 *   5. Remove redundant tests and clean up empty describe blocks
 *
 * Files are processed in parallel (one worker per file) so the
 * wall-clock time is bounded by the largest file, not the total.
 * Cross-file comparisons are never performed.
 *
 * Usage:
 *   node scripts/test-simplify.cjs
 *   npm run test:simplify
 */

'use strict';

const { exec } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jscodeshift = require('jscodeshift');

const j = jscodeshift.withParser('tsx');

/** Dedicated vitest config for single-test coverage runs (no thresholds). */
const SIMPLIFY_CONFIG = 'vitest.simplify.config.ts';

// ── Pure functions (exported for testing) ────────────────────────────────────────────

/**
 * Collect covered statement fingerprints from a single file's coverage data.
 * @param {string} filePath
 * @param {Record<string, number>} statementCounts
 * @returns {string[]}
 */
function collectStatements(filePath, statementCounts) {
  const items = [];
  for (const [id, count] of Object.entries(statementCounts)) {
    if (count > 0) items.push(`s:${filePath}:${id}`);
  }
  return items;
}

/**
 * Collect covered branch-arm fingerprints from a single file's coverage data.
 * @param {string} filePath
 * @param {Record<string, number[]>} branchCounts
 * @returns {string[]}
 */
function collectBranches(filePath, branchCounts) {
  const items = [];
  for (const [id, arms] of Object.entries(branchCounts)) {
    for (let arm = 0; arm < arms.length; arm++) {
      if (arms[arm] > 0) items.push(`b:${filePath}:${id}:${arm}`);
    }
  }
  return items;
}

/**
 * Collect covered function fingerprints from a single file's coverage data.
 * @param {string} filePath
 * @param {Record<string, number>} fnCounts
 * @returns {string[]}
 */
function collectFunctions(filePath, fnCounts) {
  const items = [];
  for (const [id, count] of Object.entries(fnCounts)) {
    if (count > 0) items.push(`f:${filePath}:${id}`);
  }
  return items;
}

/**
 * Extract a coverage fingerprint from Istanbul / V8 coverage JSON data.
 *
 * Returns a **sorted** array of strings representing every covered item:
 *   - "s:<file>:<id>"          — covered statement
 *   - "b:<file>:<id>:<arm>"    — covered branch arm
 *   - "f:<file>:<id>"          — covered function
 *
 * @param {Record<string, object>} coverageData  Parsed coverage-final.json
 * @returns {string[]}
 */
function extractCoverageFingerprint(coverageData) {
  const items = [];

  for (const [filePath, fileData] of Object.entries(coverageData)) {
    const data = /** @type {any} */ (fileData);
    if (data.s) items.push(...collectStatements(filePath, data.s));
    if (data.b) items.push(...collectBranches(filePath, data.b));
    if (data.f) items.push(...collectFunctions(filePath, data.f));
  }

  return items.sort();
}

/**
 * Check whether every element in setA also exists in setB.
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {boolean}
 */
function isSubsetOf(setA, setB) {
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

/**
 * Find tests whose coverage fingerprint is a subset of another test's.
 *
 * Algorithm:
 *   1. Sort tests by fingerprint size descending (stable by name).
 *   2. Walk from largest to smallest; keep a running list of "kept" tests.
 *   3. If a test's fingerprint ⊆ any kept test's fingerprint → subsumed.
 *
 * @param {Record<string, string[]>} testCoverageMap  testName → fingerprint items
 * @returns {string[]} Names of subsumed (redundant) tests.
 */
function findSubsumedTests(testCoverageMap) {
  const entries = Object.entries(testCoverageMap);
  if (entries.length <= 1) return [];

  // Larger fingerprints first; deterministic tie-break by name
  entries.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  /** @type {Array<[string, Set<string>]>} */
  const kept = [];
  const subsumed = [];

  for (const [name, fingerprint] of entries) {
    const fpSet = new Set(fingerprint);
    let isRedundant = false;

    for (const [, keptSet] of kept) {
      if (isSubsetOf(fpSet, keptSet)) {
        isRedundant = true;
        break;
      }
    }

    if (isRedundant) {
      subsumed.push(name);
    } else {
      kept.push([name, fpSet]);
    }
  }

  return subsumed;
}

/**
 * Extract test names from source code by walking the AST.
 *
 * Finds all `it('name', …)` and `test('name', …)` calls, including
 * `.skip` and `.only` modifiers, at any nesting depth.
 *
 * @param {string} source  Full source code of a test file
 * @returns {string[]}  Ordered list of test title strings
 */
function parseTestNames(source) {
  const { body } = withoutShebang(source);
  const root = j(body);
  const names = [];

  root
    .find(j.CallExpression)
    .filter(p => isTestCall(p.node))
    .forEach(p => {
      const name = getFirstStringArg(p.node);
      if (name !== null) names.push(name);
    });

  return names;
}

/**
 * Check whether two sorted coverage fingerprint arrays are identical.
 *
 * Both arrays must be sorted (as returned by `extractCoverageFingerprint`).
 *
 * @param {string[]} fpA
 * @param {string[]} fpB
 * @returns {boolean}
 */
function fingerprintsEqual(fpA, fpB) {
  if (fpA.length !== fpB.length) return false;
  for (let i = 0; i < fpA.length; i++) {
    if (fpA[i] !== fpB[i]) return false;
  }
  return true;
}

// ── AST helpers (powered by jscodeshift) ─────────────────────────────────────────

/**
 * Separate a possible shebang line from the rest of the source.
 *
 * jscodeshift's TSX parser does not support `#!` lines, so we strip
 * the shebang before parsing and restore it after `toSource()`.
 *
 * @param {string} source
 * @returns {{ shebang: string; body: string }}
 */
function withoutShebang(source) {
  if (!source.startsWith('#!')) return { shebang: '', body: source };
  const nl = source.indexOf('\n');
  if (nl === -1) return { shebang: source, body: '' };
  return { shebang: source.slice(0, nl + 1), body: source.slice(nl + 1) };
}

/**
 * Detect the line terminator used in the source so we can preserve it
 * when recast prints the modified AST (recast defaults to os.EOL).
 *
 * @param {string} source
 * @returns {string}
 */
function detectLineTerminator(source) {
  const idx = source.indexOf('\n');
  if (idx > 0 && source[idx - 1] === '\r') return '\r\n';
  return '\n';
}

/**
 * Return the base identifier name of a call expression's callee.
 *
 * - `it(…)`       → `'it'`
 * - `test.skip(…)` → `'test'`
 * - `describe.only(…)` → `'describe'`
 *
 * Returns `null` for unrecognised callee shapes.
 *
 * @param {import('jscodeshift').ASTNode} callee
 * @returns {string | null}
 */
function getCalleeName(callee) {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
    return callee.object.name;
  }
  return null;
}

/**
 * Return `true` when `node` is a test call (`it(…)`, `test(…)`,
 * `it.skip(…)`, `test.only(…)`, etc.).
 *
 * @param {import('jscodeshift').CallExpression} node
 * @returns {boolean}
 */
function isTestCall(node) {
  const name = getCalleeName(node.callee);
  return (name === 'it' || name === 'test') && node.arguments.length > 0;
}

/**
 * Return `true` when `node` is a describe call.
 *
 * @param {import('jscodeshift').CallExpression} node
 * @returns {boolean}
 */
function isDescribeCall(node) {
  const name = getCalleeName(node.callee);
  return name === 'describe' && node.arguments.length > 0;
}

/**
 * Return the string value of a call expression's first argument,
 * or `null` when the first argument is not a plain string.
 *
 * @param {import('jscodeshift').CallExpression} node
 * @returns {string | null}
 */
function getFirstStringArg(node) {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (arg.type === 'StringLiteral') return arg.value;
  if (
    arg.type === 'TemplateLiteral' &&
    arg.expressions.length === 0 &&
    arg.quasis.length === 1
  ) {
    return arg.quasis[0].value.cooked;
  }
  return null;
}

/**
 * Remove a single `it()` or `test()` block from source code by test name.
 *
 * Uses jscodeshift to parse the source as TypeScript and remove the matching
 * ExpressionStatement node(s) from the AST — no hand-rolled parenthesis
 * tracking, no regex-literal edge-cases.
 *
 * @param {string} source   Full source code of a test file
 * @param {string} testName Exact test title to remove
 * @returns {string} Modified source with the test removed
 */
function removeTestBlock(source, testName) {
  const { shebang, body } = withoutShebang(source);
  const root = j(body);

  root
    .find(j.ExpressionStatement)
    .filter(nodePath => {
      const { expression: expr } = nodePath.node;
      if (expr.type !== 'CallExpression') return false;
      if (!isTestCall(expr)) return false;
      return getFirstStringArg(expr) === testName;
    })
    .remove();

  return shebang + root.toSource({ lineTerminator: detectLineTerminator(source) });
}

/**
 * Add `.only` modifier to a specific `it()` or `test()` call.
 *
 * - `it('name', …)`      → `it.only('name', …)`
 * - `test('name', …)`    → `test.only('name', …)`
 * - `it.skip('name', …)` → `it.only('name', …)`
 *
 * Returns the **original source unchanged** when the test is not found,
 * so callers can detect the no-op case with a simple `===` check.
 *
 * @param {string} source   Full source code of a test file
 * @param {string} testName Exact test title to isolate
 * @returns {string} Modified source (or original if not found)
 */
function addTestOnly(source, testName) {
  const { shebang, body } = withoutShebang(source);
  const root = j(body);
  let modified = false;

  root
    .find(j.CallExpression)
    .filter(p => isTestCall(p.node) && getFirstStringArg(p.node) === testName)
    .forEach(p => {
      const { callee } = p.node;
      if (callee.type === 'Identifier') {
        // it('x') → it.only('x')
        p.node.callee = j.memberExpression(
          j.identifier(callee.name),
          j.identifier('only')
        );
        modified = true;
      } else if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier'
      ) {
        // it.skip('x') → it.only('x')
        callee.property = j.identifier('only');
        modified = true;
      }
    });

  if (!modified) return source;
  return shebang + root.toSource({ lineTerminator: detectLineTerminator(source) });
}

/**
 * Build a human-readable summary of the simplification run.
 *
 * @param {{ removed: string[]; kept: string[]; totalBefore: number; totalAfter: number }} results
 * @returns {string}
 */
function buildSummary(results) {
  const RULE = '\u2501'.repeat(50);
  const lines = ['', RULE, '  Test Simplification Summary', RULE, ''];

  if (results.removed.length === 0) {
    lines.push('  No redundant tests found. Suite is already minimal.');
  } else {
    lines.push(`  Tests before: ${results.totalBefore}`);
    lines.push(`  Tests after:  ${results.totalAfter}`);
    lines.push(`  Removed:      ${results.removed.length}`);
    lines.push('');
    lines.push('  Removed tests:');
    for (const name of results.removed) {
      lines.push(`    \u2022 ${name}`);
    }
  }

  lines.push('');
  lines.push(RULE);
  return lines.join('\n');
}

/**
 * Remove `describe()` blocks that contain no `it()` or `test()` calls.
 *
 * After `removeTestBlock` strips individual tests, a `describe` wrapper may
 * be left empty (or contain only lifecycle hooks like beforeEach/afterEach).
 * Vitest treats an empty suite as an error, so we clean them up.
 *
 * Uses jscodeshift to walk the AST and check for nested test calls.
 * Iterates until no more empty describe blocks are found (handles cascading
 * removals when removing an inner describe empties an outer one).
 *
 * @param {string} source  Full source code of a test file
 * @returns {string} Source with empty describe blocks removed
 */
function removeEmptyDescribeBlocks(source) {
  const { shebang, body } = withoutShebang(source);
  const root = j(body);
  let changed = true;

  while (changed) {
    const emptyDescribes = root
      .find(j.ExpressionStatement)
      .filter(nodePath => {
        const { expression: expr } = nodePath.node;
        if (expr.type !== 'CallExpression') return false;
        if (!isDescribeCall(expr)) return false;

        // Check whether ANY it/test call exists anywhere inside this describe
        const testCalls = j(nodePath)
          .find(j.CallExpression)
          .filter(innerPath => isTestCall(innerPath.node));

        return testCalls.length === 0;
      });

    changed = emptyDescribes.length > 0;
    if (changed) emptyDescribes.remove();
  }

  return shebang + root.toSource({ lineTerminator: detectLineTerminator(source) });
}

// ── Integration helpers (not unit-tested) ──────────────────────────────────────

/* v8 ignore start — integration code that shells out to vitest */

/**
 * Recursively find all test files (*.test.ts / *.test.tsx) under projectDir,
 * skipping node_modules, dist, and coverage directories.
 *
 * @param {string} projectDir
 * @returns {string[]}
 */
function findTestFiles(projectDir) {
  const results = [];
  const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', 'templates']);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.test\.tsx?$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(projectDir);
  return results.sort((a, b) => a.localeCompare(b));
}

// ── Async helpers ────────────────────────────────────────────────────────

/**
 * Run a shell command asynchronously. Resolves `true` on success,
 * `false` on non-zero exit (vitest often exits non-zero when
 * coverage thresholds aren't met, but the JSON is still written).
 *
 * @param {string} cmd
 * @param {object} options
 * @returns {Promise<boolean>}
 */
function execAsync(cmd, options) {
  return new Promise(resolve => {
    exec(cmd, { ...options, encoding: 'utf-8' }, error => {
      resolve(!error);
    });
  });
}

/** Maximum number of test files processed concurrently. */
const MAX_WORKERS = Math.min(os.cpus().length, 4);

/**
 * Run an array of async task-functions with bounded concurrency.
 *
 * @param {Array<() => Promise<any>>} tasks
 * @param {number} maxConcurrent
 * @returns {Promise<any[]>}
 */
async function runWithConcurrency(tasks, maxConcurrent) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(maxConcurrent, tasks.length) }, () =>
      worker()
    )
  );
  return results;
}

// ── Per-file competition ─────────────────────────────────────────────────

/**
 * Collect per-test coverage fingerprints for a single test file,
 * then apply pairwise subsumption to identify redundant tests.
 *
 * Isolation strategy: for each test, add `.only` to that test,
 * run vitest with coverage, then restore the original source.
 * Each worker writes to its own coverage directory to allow
 * concurrent file processing.
 *
 * @param {string} testFile    Absolute path to the test file
 * @param {string} projectDir
 * @param {number} fileIndex   Unique index (for the coverage directory)
 * @returns {Promise<{ file: string; subsumed: string[]; total: number }>}
 */
async function processFile(testFile, projectDir, fileIndex) {
  const relPath = path.relative(projectDir, testFile).replaceAll('\\', '/');
  const source = fs.readFileSync(testFile, 'utf-8');

  let testNames;
  try {
    testNames = parseTestNames(source);
  } catch (err) {
    console.log(`    [${relPath}] parse error — skipped (${err.message})`);
    return { file: testFile, subsumed: [], total: 0 };
  }

  if (testNames.length <= 1) {
    console.log(`    [${relPath}] ${testNames.length} test(s) — skipped`);
    return { file: testFile, subsumed: [], total: testNames.length };
  }

  console.log(`    [${relPath}] ${testNames.length} test(s) — collecting…`);

  const covDir = path.join('coverage', `simplify-${fileIndex}`);
  const covFile = path.join(projectDir, covDir, 'coverage-final.json');

  /** @type {Record<string, string[]>} */
  const testCoverageMap = {};

  for (let i = 0; i < testNames.length; i++) {
    const name = testNames[i];

    // Isolate this test with .only
    const modified = addTestOnly(source, name);
    if (modified === source) {
      // Could not isolate (e.g. template-literal name) — skip safely
      continue;
    }

    fs.writeFileSync(testFile, modified, 'utf-8');

    // Remove stale coverage data
    if (fs.existsSync(covFile)) fs.unlinkSync(covFile);

    const cmd = [
      'npx vitest run',
      `--config ${SIMPLIFY_CONFIG}`,
      `"${relPath}"`,
      '--coverage',
      `--coverage.reportsDirectory=${covDir}`,
    ].join(' ');

    await execAsync(cmd, { cwd: projectDir, timeout: 120_000 });

    if (fs.existsSync(covFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(covFile, 'utf-8'));
        testCoverageMap[name] = extractCoverageFingerprint(data);
      } catch { /* skip */ }
    }

    // Restore original immediately
    fs.writeFileSync(testFile, source, 'utf-8');
  }

  // Pairwise subsumption (within this file only — never cross-file)
  const subsumed = findSubsumedTests(testCoverageMap);
  const collected = Object.keys(testCoverageMap).length;
  console.log(
    `    [${relPath}] ${collected}/${testNames.length} fingerprints → ` +
      `${subsumed.length} redundant`
  );

  return { file: testFile, subsumed, total: testNames.length };
}

// ── CLI entry point ──────────────────────────────────────────────────────

async function main() {
  const projectDir = process.cwd();
  const RULE = '\u2501'.repeat(50);

  console.log('');
  console.log(RULE);
  console.log('  Test Simplification Tool');
  console.log(RULE);
  console.log('');
  console.log('  Algorithm: per-file pairwise subsumption');
  console.log(`  Concurrency: up to ${MAX_WORKERS} file(s) in parallel`);
  console.log('');

  // Step 1 ─ Discover test files
  console.log('  Step 1: Finding test files…');
  const testFiles = findTestFiles(projectDir);
  console.log(`          Found ${testFiles.length} test file(s).`);

  if (testFiles.length === 0) {
    console.log('  No test files found. Nothing to simplify.');
    process.exit(0);
  }

  // Step 2 ─ Collect per-test fingerprints & analyse (parallel)
  console.log('');
  console.log('  Step 2: Collecting per-test coverage & analysing…');
  console.log('');

  const results = await runWithConcurrency(
    testFiles.map((file, i) => () => processFile(file, projectDir, i)),
    MAX_WORKERS
  );

  // Step 3 ─ Apply removals
  console.log('');
  console.log('  Step 3: Applying removals…');

  let totalBefore = 0;
  const allRemoved = [];

  for (const result of results) {
    totalBefore += result.total;

    if (result.subsumed.length === 0) continue;

    // Safety: never remove ALL tests from a file
    if (result.subsumed.length >= result.total) {
      const rp = path.relative(projectDir, result.file);
      console.log(`          Skipped: ${rp} (would remove all tests — preserved)`);
      continue;
    }

    let src = fs.readFileSync(result.file, 'utf-8');
    for (const testName of result.subsumed) {
      src = removeTestBlock(src, testName);
    }
    src = removeEmptyDescribeBlocks(src);
    fs.writeFileSync(result.file, src, 'utf-8');
    allRemoved.push(...result.subsumed);
  }

  // Clean up worker coverage directories
  for (let i = 0; i < testFiles.length; i++) {
    const dir = path.join(projectDir, 'coverage', `simplify-${i}`);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // Step 4 ─ Summary
  const summary = buildSummary({
    removed: allRemoved,
    kept: [],
    totalBefore,
    totalAfter: totalBefore - allRemoved.length,
  });
  console.log(summary);
}

// Run when invoked directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

/* v8 ignore stop */

// Export pure functions for testing
module.exports = {
  extractCoverageFingerprint,
  isSubsetOf,
  findSubsumedTests,
  removeTestBlock,
  addTestOnly,
  removeEmptyDescribeBlocks,
  buildSummary,
  parseTestNames,
  fingerprintsEqual,
};