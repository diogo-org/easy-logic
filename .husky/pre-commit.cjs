#!/usr/bin/env node
/**
 * TDD-enforcing pre-commit hook.
 *
 * Enforces the red-green TDD cycle at commit time using two explicit conditions
 * and a persistent marker file (.git/.tdd-red-phase) to track state between commits.
 *
 *   RED phase   — two conditions must BOTH be true:
 *                   1. New test files are staged (Added to index, not present in HEAD)
 *                   2. Running the test suite produces at least one failure
 *                 On success: writes .git/.tdd-red-phase marker and allows commit.
 *
 *   GREEN phase — two conditions must BOTH be true:
 *                   1. The previous commit was a red phase (marker file exists)
 *                   2. All tests now pass (exit code 0)
 *                 On success: clears .git/.tdd-red-phase marker and allows commit.
 *
 *   SAFE (no TDD marker) — implementation staged without a preceding red phase:
 *                   All tests must pass (standard safety net, not a TDD phase).
 *
 *   SKIP — no source files staged (docs, config only): no test run.
 *
 * Always runs:
 *   Step 1 — secrets detection on staged files
 *   Step 2 — TDD phase enforcement
 */

const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parseVitestRunOutput } = require('../scripts/vitest-output.cjs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function printStatus(passed, message) {
  const icon = passed ? '\u2713' : '\u2717';
  const color = passed ? colors.green : colors.red;
  log(color, `${icon} ${message}`);
}

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|js|mts|mjs)$/;
const SOURCE_FILE_PATTERN = /\.(ts|js|cjs|mjs)$/;
const RED_PHASE_MARKER = '.tdd-red-phase';

// ─── Marker file helpers ────────────────────────────────────────────────────

function getGitDir() {
  try {
    return execSync('git rev-parse --git-dir', { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '.git';
  }
}

function getMarkerPath() {
  return path.join(getGitDir(), RED_PHASE_MARKER);
}

function isRedPhaseMarked() {
  return fs.existsSync(getMarkerPath());
}

function setRedPhaseMarker() {
  try {
    fs.writeFileSync(getMarkerPath(), String(Date.now()), 'utf-8');
  } catch {
    // Non-fatal: marker write failure should not block the commit
  }
}

function clearRedPhaseMarker() {
  try {
    const p = getMarkerPath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // Non-fatal
  }
}

// ─── File classification ────────────────────────────────────────────────────

/**
 * Classify staged files.
 *
 * newTestFiles — Added (new) test files not present in HEAD.
 * testFiles    — all staged test files (new or modified).
 * implFiles    — staged non-test source files.
 * allSourceFiles — all staged source files.
 */
function classifyStagedFiles() {
  let allStagedRaw = '';
  let addedRaw = '';
  try {
    allStagedRaw = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
    addedRaw = execSync('git diff --cached --name-only --diff-filter=A', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
  } catch {
    return { testFiles: [], newTestFiles: [], implFiles: [], allSourceFiles: [] };
  }

  const staged = allStagedRaw.split('\n').filter(Boolean);
  const added = addedRaw.split('\n').filter(Boolean);

  const testFiles = staged.filter(f => TEST_FILE_PATTERN.test(f));
  const newTestFiles = added.filter(f => TEST_FILE_PATTERN.test(f));
  const allSourceFiles = staged.filter(f => SOURCE_FILE_PATTERN.test(f));
  const implFiles = allSourceFiles.filter(f => !TEST_FILE_PATTERN.test(f));

  return { testFiles, newTestFiles, implFiles, allSourceFiles };
}

// ─── Test runner ────────────────────────────────────────────────────────────

/**
 * Run vitest without coverage and return parsed output + exit code.
 * Never throws — captures all output.
 */
function runTests() {
  const result = spawnSync('npx', ['vitest', 'run'], { // NOSONAR
    encoding: 'utf-8',
    shell: true,
  });
  const output = (result.stdout || '') + (result.stderr || '');
  const parsed = parseVitestRunOutput(output);
  return {
    output,
    exitCode: result.status ?? 1,
    ...parsed,
  };
}

// ─── Banner ─────────────────────────────────────────────────────────────────

console.log(`${colors.bold}${colors.cyan}\u{1F9EA} TDD Pre-commit Hook${colors.reset}\n`);

// ─── Step 1: Secrets detection ──────────────────────────────────────────────
console.log('Step 1: Checking staged files for secrets...');
try {
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    // Exclude hook files and test/spec files — those intentionally contain example patterns
    .filter(f => f && !f.startsWith('.husky/') && !/\.(test|spec)\.(ts|js|mts|mjs|cjs)$/.test(f));

  const secretPatterns = [
    { regex: /_authToken=.+/i, description: 'Auth token' },
    { regex: /password\s*=\s*['"][^'"]+['"]/i, description: 'Password' },
    { regex: /api[_-]?key\s*[:=]\s*['"]?[a-z0-9]{20,}['"]?/i, description: 'API key' },
    { regex: /secret[_-]?key\s*[:=]\s*['"]?[a-z0-9]{20,}['"]?/i, description: 'Secret key' },
    { regex: /token\s*[:=]\s*['"]?[a-z0-9]{20,}['"]?/i, description: 'Token' },
    { regex: /bearer\s+[a-z0-9_.~+\-/]+=*/i, description: 'Bearer token' },
    { regex: /ghp_[a-z0-9]{36}/i, description: 'GitHub Personal Access Token' },
    { regex: /gho_[a-z0-9]{36}/i, description: 'GitHub OAuth token' },
    { regex: /github_pat_[a-z0-9]{22}_[a-z0-9]{59}/i, description: 'GitHub fine-grained PAT' },
  ];

  const secretsFound = [];

  for (const file of stagedFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    secretPatterns.forEach(({ regex, description }) => {
      lines.forEach((line, index) => {
        if (regex.test(line) && !line.includes('${GITHUB_TOKEN}')) {
          secretsFound.push({ file, line: index + 1, description,
            preview: line.substring(0, 80).trim() + (line.length > 80 ? '...' : '') });
        }
      });
    });
  }

  if (secretsFound.length > 0) {
    printStatus(false, `Found ${secretsFound.length} potential secret(s) in staged files`);
    console.log('\nSecrets detected:');
    secretsFound.forEach(({ file, line, description, preview }) => {
      console.log(`  ${file}:${line} - ${description}`);
      console.log(`    ${preview}`);
    });
    log(colors.yellow, '\n\u{1F4A1} Use environment variables like ${GITHUB_TOKEN} instead');
    log(colors.red, '\n\u274C Commit aborted: Remove all secrets before committing');    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Open each file:line listed above and remove the hardcoded secret value.');
    log(colors.cyan, '   Replace it with an environment variable reference, e.g. process.env.MY_TOKEN.');
    log(colors.cyan, '   Stage the fixed files with `git add <file>`, then retry the commit.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');    process.exit(1);
  }

  printStatus(true, 'No secrets detected in staged files');
} catch (error) {
  if (error.code === 1) throw error;
  printStatus(true, 'No secrets detected (no staged files)');
}
console.log('');

// ─── Step 2: TDD phase ──────────────────────────────────────────────────────
const { testFiles, newTestFiles, implFiles, allSourceFiles } = classifyStagedFiles();
const redMarkerExists = isRedPhaseMarked();

if (allSourceFiles.length === 0) {
  log(colors.yellow, 'Step 2: TDD check skipped (no source files staged)');
  console.log('');
  log(colors.green, '\u2705 Pre-commit checks passed!');
  log(colors.yellow, '   Full quality gate runs at push time (pre-push hook).');
  process.exit(0);
}

// RED: new test files are staged AND no implementation files
const isRedCandidate = newTestFiles.length > 0 && implFiles.length === 0;
// GREEN: red marker exists (previous commit was red) AND implementation is now staged
const isGreenCandidate = redMarkerExists && implFiles.length > 0;

if (isRedCandidate) {
  // ── RED phase ───────────────────────────────────────────────────────────
  console.log(`Step 2: ${colors.red}${colors.bold}RED phase${colors.reset} — new test files staged, running tests...`);
  console.log(`        New test files: ${newTestFiles.join(', ')}`);
  console.log('        Tests MUST fail to confirm the red state.\n');

  const { exitCode, failedTests, passedTests, skippedTests } = runTests();

  if (skippedTests > 0) {
    printStatus(false, `${skippedTests} skipped test(s) detected`);
    log(colors.red, '\n\u274C Commit aborted: Remove test skips before committing');
    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Search for it.skip / test.skip / describe.skip / xit / xdescribe in staged test files.');
    log(colors.cyan, '   Remove the skip modifier and make the test pass legitimately.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');
    process.exit(1);
  }

  if (exitCode === 0) {
    printStatus(false, `All ${passedTests} test(s) pass \u2014 RED phase requires at least one failure`);
    console.log('');
    log(colors.yellow, '\u{1F4A1} The new tests you staged already pass. This means one of:');
    log(colors.yellow, '   - The implementation already exists (stage it too for GREEN phase), or');
    log(colors.yellow, '   - The test does not actually test anything new.');
    log(colors.red, '\n\u274C Commit aborted: New tests must FAIL before the red commit.');
    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Option A: Write a test that genuinely fails (no implementation yet), then commit only the test.');
    log(colors.cyan, '   Option B: If the implementation already exists, stage both the test AND the implementation');
    log(colors.cyan, '             together \u2014 skips RED and does a SAFE commit instead.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');
    process.exit(1);
  }

  // Tests fail — valid red state
  setRedPhaseMarker();
  printStatus(true, `Red phase confirmed: ${failedTests} test(s) failing, ${passedTests} passing`);
  console.log('');
  log(colors.red, '\u{1F534} RED \u2192 now implement the code to make these tests pass, then commit.');

} else if (isGreenCandidate) {
  // ── GREEN phase ─────────────────────────────────────────────────────────
  const staged = [...implFiles, ...testFiles];
  const extraFiles = staged.length > 5 ? ` (+${staged.length - 5} more)` : '';
  console.log(`Step 2: ${colors.green}${colors.bold}GREEN phase${colors.reset} — implementation staged after red commit`);
  console.log(`        Staged files: ${staged.slice(0, 5).join(', ')}${extraFiles}`);
  console.log('        Tests MUST all pass to complete the green phase.\n');

  const { exitCode, failedTests, passedTests, skippedTests, output } = runTests();

  if (skippedTests > 0) {
    printStatus(false, `${skippedTests} skipped test(s) detected`);
    log(colors.red, '\n\u274C Commit aborted: Remove test skips before committing');
    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Search for it.skip / test.skip / describe.skip / xit / xdescribe in staged test files.');
    log(colors.cyan, '   Remove the skip modifier and make the test pass legitimately.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');
    process.exit(1);
  }

  if (exitCode !== 0) {
    printStatus(false, `${failedTests} test(s) still failing \u2014 fix them to complete the green phase`);
    console.log('\n' + output.split('\n').slice(-30).join('\n'));
    log(colors.yellow, '\u{1F4A1} Fix the failing tests, then stage your changes and commit again.');
    log(colors.red, '\n\u274C Commit aborted: All tests must pass to complete the green phase.');
    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Read the test failure output above. Fix the implementation so all tests pass.');
    log(colors.cyan, '   Run `npm test -- --run` to verify locally before committing.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');
    process.exit(1);
  }

  clearRedPhaseMarker();
  printStatus(true, `Green phase confirmed: all ${passedTests} test(s) passing`);
  console.log('');
  log(colors.green, '\u{1F7E2} GREEN \u2192 all tests pass. Red/green cycle complete!');

} else {
  // ── SAFE (no TDD cycle active) ───────────────────────────────────────────
  // Implementation staged without a preceding red phase commit.
  // Just require all tests pass as a safety net.
  const stagedDesc = implFiles.length > 0 ? 'implementation files' : 'source files';
  console.log(`Step 2: ${colors.yellow}SAFE check${colors.reset} — ${stagedDesc} staged (no active TDD cycle)`);
  console.log('        Running tests — all must pass.\n');

  const { exitCode, failedTests, passedTests, skippedTests, output } = runTests();

  if (skippedTests > 0) {
    printStatus(false, `${skippedTests} skipped test(s) detected`);
    log(colors.red, '\n\u274C Commit aborted: Remove test skips before committing');
    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Search for it.skip / test.skip / describe.skip / xit / xdescribe in staged test files.');
    log(colors.cyan, '   Remove the skip modifier and make the test pass legitimately.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');
    process.exit(1);
  }

  if (exitCode !== 0) {
    printStatus(false, `${failedTests} test(s) failing`);
    console.log('\n' + output.split('\n').slice(-30).join('\n'));
    log(colors.yellow, '\u{1F4A1} Tip: Use TDD \u2014 commit a failing test first (red), then the fix (green).');
    log(colors.red, '\n\u274C Commit aborted: Fix all failing tests before committing.');
    console.log('');
    log(colors.cyan, '\u{1F916} AI ASSISTANT \u2014 HOW TO FIX THIS:');
    log(colors.cyan, '   Read the test failure output above. Fix the implementation so all tests pass.');
    log(colors.cyan, '   Run `npm test -- --run` to verify locally before committing.');
    log(colors.cyan, '   \u26d4 NEVER bypass with --no-verify, HUSKY=0, or git commit -n.');
    process.exit(1);
  }

  printStatus(true, `All ${passedTests} test(s) passing`);
}

console.log('');
log(colors.green, '\u2705 Pre-commit checks passed!');
log(colors.yellow, '   Full quality gate runs at push time (pre-push hook).');