#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parseVitestRunOutput } = require('../scripts/vitest-output.cjs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function printStatus(passed, message) {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(color, `${icon} ${message}`);
}

// AI ENFORCEMENT NOTICE — This must be the very first output
console.log('\x1b[33m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[33m║  🤖 AI NOTICE: Pre-push rules are MANDATORY                  ║\x1b[0m');
console.log('\x1b[33m║  If you are an AI assistant, you MUST fix every issue below.  ║\x1b[0m');
console.log('\x1b[33m║  NEVER use --no-verify or HUSKY=0 to bypass this hook.        ║\x1b[0m');
console.log('\x1b[33m║  Use `npm run push` instead of `git push`.                    ║\x1b[0m');
console.log('\x1b[33m╚══════════════════════════════════════════════════════════════╝\x1b[0m');
console.log('');
console.log('🔍 Running pre-push checks...\n');

function runTestsWithCoverage(stepLabel) {
  console.log(`${stepLabel}: Running tests with coverage...`);
  try {
    const testOutput = execSync('npx vitest run --coverage', {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    const { coverage, skippedTests } = parseVitestRunOutput(testOutput);

    const THRESHOLD = 80;
    if (skippedTests > 0) {
      printStatus(false, `Detected ${skippedTests} skipped test(s)`);
      console.log(testOutput.split('\n').slice(-20).join('\n'));
      log(colors.red, '\n❌ Push aborted: Remove test skips (e.g. it.skip/test.skip/describe.skip) before pushing');
      console.log('');
      log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
      log(colors.cyan, '   Search for it.skip / test.skip / describe.skip / xit / xdescribe in your files.');
      log(colors.cyan, '   Remove the skip modifier and make the test pass legitimately.');
      log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
      process.exit(1);
    }

    if (coverage < THRESHOLD) {
      printStatus(false, `Tests passed but coverage too low: ${coverage}% (minimum: ${THRESHOLD}%)`);
      console.log(testOutput.split('\n').slice(-20).join('\n'));
      log(colors.red, `\n❌ Push aborted: Code coverage must be at least ${THRESHOLD}%`);
      console.log('');
      log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
      log(colors.cyan, '   Add tests that cover the uncovered lines/branches shown above.');
      log(colors.cyan, '   Run `npm run test:coverage` to see a detailed HTML coverage report.');
      log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
      process.exit(1);
    }

    printStatus(true, `Tests passed with ${coverage}% coverage (>= ${THRESHOLD}%)`);
  } catch (error) {
    printStatus(false, 'Tests failed');
    console.log(error.stdout?.toString().slice(-1000) || '');
    log(colors.red, '\n❌ Push aborted: Tests must pass before pushing');
    console.log('');
    log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
    log(colors.cyan, '   Read the test failure output above. Fix the implementation (never delete/skip tests).');
    log(colors.cyan, '   Run `npm test -- --run` locally to verify all tests pass before pushing.');
    log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
    process.exit(1);
  }
  console.log('');
}

// Step 1: Run bootstrap update to keep project in sync with latest template
console.log('Step 1: Updating TypeScript Bootstrap...');
try {
  execSync('npx typescript-bootstrap update --skip-prompts', {
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 60000,
  });
  printStatus(true, 'Bootstrap update applied (or already up to date)');
} catch {
  // Update failure is non-fatal: bootstrap may not be installed globally.
  // Warn but let the push proceed so developers without the package are not blocked.
  log(colors.yellow, '⚠️  Bootstrap update skipped (npx typescript-bootstrap not available)');
  log(colors.yellow, '   Run `npx typescript-bootstrap update` manually when convenient');
}
console.log('');

// Step 2: Disallow --no-verify bypass
console.log('Step 2: Verifying pre-push hooks are not bypassed...');
(function checkNoVerifyPrevention() {
  // Verify the .husky/pre-push shell script still delegates to this CJS hook.
  // If someone tampers with it to bypass checks, this will catch it.
  const hookShellPath = path.join(process.cwd(), '.husky', 'pre-push');
  const expectedContent = 'node';
  if (fs.existsSync(hookShellPath)) {
    const hookContent = fs.readFileSync(hookShellPath, 'utf-8');
    if (!hookContent.includes(expectedContent) || !hookContent.includes('pre-push.cjs')) {
      printStatus(false, '.husky/pre-push has been tampered with');
      log(colors.red, '\n❌ Push aborted: .husky/pre-push must delegate to pre-push.cjs');
      log(colors.yellow, '   Restore .husky/pre-push to: node "$(dirname "$0")/pre-push.cjs"');
      console.log('');
      log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
      log(colors.cyan, '   Restore the file .husky/pre-push to contain exactly:');
      log(colors.cyan, '     node "$(dirname "$0")/pre-push.cjs"');
      log(colors.cyan, '   Do not remove or replace this line with a no-op or empty script.');
      log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
      process.exit(1);
    }
  }

  printStatus(true, 'Pre-push hook integrity verified');
  log(colors.yellow, '   ⚠️  Never use `git push --no-verify`. Use `npm run push` instead.');
})();
console.log('');

// Step 3: Always run tests first
runTestsWithCoverage('Step 3');

// Step 4: Check for conflicts with main branch
console.log('Step 4: Checking for conflicts with main...');
try {
  // Get current branch
  const currentBranch = execSync('git branch --show-current', {
    encoding: 'utf-8',
    stdio: 'pipe'
  }).trim();

  // Skip check if we're on main or master
  if (currentBranch === 'main' || currentBranch === 'master') {
    printStatus(true, 'On main/master branch, skipping conflict check');
  } else {
    // Fetch latest main silently (don't fail if remote doesn't exist)
    try {
      execSync('git fetch origin main:refs/remotes/origin/main 2>&1', {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    } catch {
      // If fetch fails (e.g., no remote), skip this check
      printStatus(true, 'No remote main found, skipping conflict check');
      console.log('');
    }

    // Try to detect if merge would have conflicts
    try {
      // Get the merge-base
      const mergeBase = execSync('git merge-base HEAD origin/main', { // NOSONAR
        encoding: 'utf-8',
        stdio: 'pipe'
      }).trim();

      // Attempt a dry-run merge using merge-tree
      const mergeResult = execSync(`git merge-tree ${mergeBase} HEAD origin/main`, { // NOSONAR
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // Check if the output contains conflict markers
      if (mergeResult.includes('<<<<<<<')) {
        printStatus(false, 'Conflicts detected with main branch');
        log(colors.yellow, '\n💡 Your branch has conflicts with main. Options:');
        log(colors.yellow, '   1. Merge main into your branch: git merge origin/main');
        log(colors.yellow, '   2. Rebase on main: git rebase origin/main');
        log(colors.yellow, '   3. Resolve conflicts before pushing');
        log(colors.red, '\n❌ Push aborted: Resolve conflicts with main first');
        console.log('');
        log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
        log(colors.cyan, '   Run: git fetch origin main && git rebase origin/main');
        log(colors.cyan, '   Resolve conflict markers (<<<<<<< / ======= / >>>>>>>) in the listed files.');
        log(colors.cyan, '   Stage resolved files with `git add <file>`, then re-run `npm run push`.');
        log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
        process.exit(1);
      }

      printStatus(true, 'No conflicts with main branch');
    } catch {
      // If git commands fail for other reasons, let it pass
      printStatus(true, 'Conflict check skipped (git error)');
    }
  }
} catch {
  // If git commands fail for other reasons, don't block the push
  printStatus(true, 'Conflict check skipped (git error)');
}
console.log('');

// Step 5: Enforce version bump
console.log('Step 5: Enforcing version bump...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;

  // Get the version from the remote main branch
  let remoteVersion;
  try {
    const remotePackageJson = execSync('git show origin/main:package.json', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    remoteVersion = JSON.parse(remotePackageJson).version;
  } catch {
    // Could not fetch remote version — skip check
    printStatus(true, 'Version check skipped (no remote version to compare)');
    console.log('');
  }

  if (remoteVersion) {
    // Parse semantic versions
    const parseVersion = (v) => v.split('.').map(Number);
    const [currMajor, currMinor, currPatch] = parseVersion(currentVersion);
    const [remMajor, remMinor, remPatch] = parseVersion(remoteVersion);

    // Check if current version is lower than remote version
    const isDowngrade =
      currMajor < remMajor ||
      (currMajor === remMajor && currMinor < remMinor) ||
      (currMajor === remMajor && currMinor === remMinor && currPatch < remPatch);

    const isSameVersion = currentVersion === remoteVersion;

    if (isDowngrade) {
      printStatus(false, `Version downgrade detected: ${remoteVersion} → ${currentVersion}`);
      log(colors.yellow, '\n💡 Version downgrades are not allowed. Use one of these commands:');
      log(colors.yellow, '   - npm run version:patch (for bug fixes)');
      log(colors.yellow, '   - npm run version:minor (for new features)');
      log(colors.yellow, '   - npm run version:major (for breaking changes)');
      log(colors.red, '\n❌ Push aborted: Never downgrade package versions');
      console.log('');
      log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
      log(colors.cyan, '   Run `npm run version:patch` (or :minor / :major) to increment the version correctly.');
      log(colors.cyan, '   Stage the updated package.json and package-lock.json, then retry the push.');
      log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
      process.exit(1);
    }

    if (isSameVersion) {
      printStatus(false, `Version was not bumped: ${remoteVersion} → ${currentVersion}`);
      log(colors.yellow, '\n💡 Every push must bump package version. Use one of these commands:');
      log(colors.yellow, '   - npm run version:patch (for bug fixes)');
      log(colors.yellow, '   - npm run version:minor (for new features)');
      log(colors.yellow, '   - npm run version:major (for breaking changes)');
      log(colors.red, '\n❌ Push aborted: package.json version must be incremented');
      console.log('');
      log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
      log(colors.cyan, '   Run `npm run version:patch` (bug fix), `npm run version:minor` (new feature),');
      log(colors.cyan, '   or `npm run version:major` (breaking change) to bump the version.');
      log(colors.cyan, '   Stage the updated package.json and package-lock.json, then retry the push.');
      log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
      process.exit(1);
    }

    printStatus(true, `Version check passed: ${remoteVersion} → ${currentVersion}`);
    console.log('');
  }
} catch {
  // If we can't read package.json, let it fail in later checks
  printStatus(false, 'Could not check version');
  log(colors.red, '\n❌ Push aborted: Could not read package.json');
  process.exit(1);
}

// Step 6: Verify package-lock.json is in sync
console.log('Step 6: Verifying package-lock.json...');
try {
  // Check if package-lock.json exists
  if (!fs.existsSync('package-lock.json')) {
    printStatus(false, 'package-lock.json not found');
    log(colors.yellow, '\n💡 Run "npm install" to generate package-lock.json');
    log(colors.red, '\n❌ Push aborted: package-lock.json is required for CI');
    console.log('');
    log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
    log(colors.cyan, '   Run `npm install` to generate package-lock.json.');
    log(colors.cyan, '   Stage it with `git add package-lock.json`, commit it, then retry the push.');
    log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
    process.exit(1);
  }

  // Verify npm ci would work (validates package-lock.json is in sync)
  execSync('npm ci --dry-run', {
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  });

  printStatus(true, 'package-lock.json is valid and in sync');
} catch (error) {
  printStatus(false, 'package-lock.json validation failed');
  console.log(error.stdout?.toString().slice(-1000) || error.stderr?.toString().slice(-1000) || '');
  log(colors.yellow, '\n💡 Run "npm install" to fix package-lock.json');
  log(colors.red, '\n❌ Push aborted: package-lock.json must be valid for npm ci to work in CI');
  console.log('');
  log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
  log(colors.cyan, '   Run `npm install` to regenerate a valid package-lock.json.');
  log(colors.cyan, '   Stage it with `git add package-lock.json`, commit it, then retry the push.');
  log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
  process.exit(1);
}
console.log('');

// Step 7: Run ESLint
console.log('Step 7: Running ESLint...');
try {
  execSync('npm run lint', {
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  });
  printStatus(true, 'ESLint passed - no violations');
} catch (error) {
  printStatus(false, 'ESLint found violations');
  console.log(error.stdout?.toString().slice(-2000) || '');
  log(colors.yellow, '\n💡 Run "npm run lint:fix" to auto-fix some issues');
  log(colors.red, '\n❌ Push aborted: Fix all ESLint errors before pushing');
  console.log('');
  log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
  log(colors.cyan, '   Run `npm run lint:fix` to auto-fix what ESLint can fix automatically.');
  log(colors.cyan, '   For remaining errors, read each violation above and fix the code manually.');
  log(colors.cyan, '   ⛔ NEVER add eslint-disable comments to hide errors.');
  log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
  process.exit(1);
}
console.log('');

// Step 8: Check code duplication
console.log('Step 8: Checking code duplication...');
try {
  // Run jscpd - it will exit with error code if threshold is exceeded
  execSync('npx jscpd src --reporters json --silent', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });

  // Read the report file
  const reportPath = path.join(process.cwd(), 'report', 'jscpd-report.json');
  if (fs.existsSync(reportPath)) {
    const reportData = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(reportData);
    const duplicationPercentage = report.statistics?.total?.percentage || 0;

    const DUPLICATION_THRESHOLD = 1;
    if (duplicationPercentage > DUPLICATION_THRESHOLD) {
      printStatus(false, `Code duplication too high: ${duplicationPercentage.toFixed(2)}% (maximum: ${DUPLICATION_THRESHOLD}%)`);
      log(colors.red, `\n❌ Push aborted: Code duplication must be at most ${DUPLICATION_THRESHOLD}%`);
      log(colors.yellow, 'Run "npx jscpd src" to see detailed duplication report');
      console.log('');
      log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
      log(colors.cyan, '   Run `npx jscpd src` to identify duplicated blocks.');
      log(colors.cyan, '   Extract the shared logic into a utility function and import it in both places.');
      log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
      process.exit(1);
    }

    printStatus(true, `Duplication check passed (${duplicationPercentage.toFixed(2)}% <= ${DUPLICATION_THRESHOLD}%)`);
  } else {
    // No report file means no duplication
    printStatus(true, 'Duplication check passed (0.00% <= 1%)');
  }
} catch {
  // jscpd exits with non-zero if duplication exceeds threshold
  const reportPath = path.join(process.cwd(), 'report', 'jscpd-report.json');
  if (fs.existsSync(reportPath)) {
    const reportData = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(reportData);
    const duplicationPercentage = report.statistics?.total?.percentage || 0;

    const DUPLICATION_THRESHOLD = 1;
    printStatus(false, `Code duplication too high: ${duplicationPercentage.toFixed(2)}% (maximum: ${DUPLICATION_THRESHOLD}%)`);
    log(colors.red, `\n❌ Push aborted: Code duplication must be at most ${DUPLICATION_THRESHOLD}%`);
    log(colors.yellow, 'Run "npx jscpd src" to see detailed duplication report');
    console.log('');
    log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
    log(colors.cyan, '   Run `npx jscpd src` to identify duplicated blocks.');
    log(colors.cyan, '   Extract the shared logic into a utility function and import it in both places.');
    log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
    process.exit(1);
  } else {
    printStatus(false, 'Duplication check failed - could not read report');
    log(colors.red, '\n❌ Push aborted: Could not determine duplication percentage');
    process.exit(1);
  }
}
console.log('');

// Step 9: Check for secrets
console.log('Step 9: Checking for secrets...');
try {
  // Get list of files changed vs origin/main
  // Exclude: .husky/ (hook files define patterns intentionally)
  //          test/spec files  (contain example secret patterns as test fixtures)
  const TEST_SPEC_PATTERN = /\.(test|spec)\.(ts|js|mts|mjs|cjs)$/;
  const changedFiles = execSync('git diff --name-only origin/main...HEAD', {
    encoding: 'utf-8'
  }).trim().split('\n').filter(f => f && !f.startsWith('.husky/') && !TEST_SPEC_PATTERN.test(f));

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

  for (const file of changedFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    secretPatterns.forEach(({ regex, description }) => {
      lines.forEach((line, index) => {
        if (regex.test(line) && !line.includes('${GITHUB_TOKEN}')) {
          secretsFound.push({
            file,
            line: index + 1,
            description,
            preview: line.substring(0, 80).trim() + (line.length > 80 ? '...' : '')
          });
        }
      });
    });
  }

  if (secretsFound.length > 0) {
    printStatus(false, `Found ${secretsFound.length} potential secret(s)`);
    console.log('\nSecrets detected:');
    secretsFound.forEach(({ file, line, description, preview }) => {
      console.log(`  ${file}:${line} - ${description}`);
      console.log(`    ${preview}`);
    });
    log(colors.yellow, '\n💡 Never push secrets, tokens, or passwords');
    log(colors.yellow, 'Use environment variables like ${GITHUB_TOKEN} instead');
    log(colors.red, '\n❌ Push aborted: Remove all secrets before pushing');
    console.log('');
    log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
    log(colors.cyan, '   Open each file:line listed above and remove the hardcoded secret value.');
    log(colors.cyan, '   Replace it with an environment variable reference, e.g. process.env.MY_TOKEN.');
    log(colors.cyan, '   Commit the fix as a new commit, then retry the push.');
    log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
    process.exit(1);
  }

  printStatus(true, 'No secrets detected');
} catch (error) {
  if (error.code === 1) {
    throw error;
  }
  // Don't fail on git diff errors (e.g., no changed files)
  printStatus(true, 'No secrets detected (no changed files)');
}
console.log('');

// Step 10: TypeScript type check
console.log('Step 10: TypeScript type checking...');
try {
  execSync('npx tsc --noEmit', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  printStatus(true, 'TypeScript type check passed');
} catch (error) {
  printStatus(false, 'TypeScript type errors found');
  console.log(error.stdout?.toString() || '');
  log(colors.red, '\n❌ Push aborted: Fix all TypeScript errors before pushing');
  console.log('');
  log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
  log(colors.cyan, '   Read each error above \u2014 it includes the file path, line number, and description.');
  log(colors.cyan, '   Fix the type errors in the source files. Do NOT add `any` casts or @ts-ignore to hide them.');
  log(colors.cyan, '   Run `npx tsc --noEmit` locally to verify all errors are resolved before pushing.');
  log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
  process.exit(1);
}
console.log('');

// Step 11: Build check
console.log('Step 11: Building project...');
try {
  execSync('npm run build', {
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  });

  printStatus(true, 'Build successful');
} catch (error) {
  printStatus(false, 'Build failed');
  console.log(error.stdout?.toString().slice(-1000) || '');
  log(colors.red, '\n❌ Push aborted: Build must succeed without errors');
  console.log('');
  log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
  log(colors.cyan, '   Read the build output above for the root cause of the failure.');
  log(colors.cyan, '   Fix the source error (type mismatch, missing export, syntax error, etc.).');
  log(colors.cyan, '   Run `npm run build` locally to confirm it passes before pushing.');
  log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
  process.exit(1);
}
console.log('');

// Step 12: Check for dead code
console.log('Step 12: Checking for dead code...');
try {
  execSync('npx knip', {
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  printStatus(true, 'No dead code detected');
} catch (error) {
  printStatus(false, 'Dead code detected');
  console.log(error.stdout?.toString() || '');
  log(colors.yellow, '\n💡 Run "npx knip" to see detailed dead code analysis');
  log(colors.red, '\n❌ Push aborted: Remove unused code before pushing');
  console.log('');
  log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
  log(colors.cyan, '   Run `npx knip` to see all unused exports, files, and dependencies.');
  log(colors.cyan, '   Delete or unexport the listed symbols. If truly needed via dynamic import,');
  log(colors.cyan, '   add it to the `ignore` list in knip.json only as a last resort.');
  log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
  process.exit(1);
}
console.log('');

// Helper: extract sonarjs/ violations from ESLint stylish output, grouped by file
function collectSonarJsLines(output) {
  const result = [];
  let currentFile = '';
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    const isFileHeader = line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')
      && !trimmed.startsWith('✖') && !trimmed.startsWith('✓') && !trimmed.includes('sonarjs/');
    if (isFileHeader) {
      currentFile = trimmed;
    }
    if (line.includes('sonarjs/')) {
      if (currentFile && result.at(-1) !== currentFile) {
        result.push(currentFile);
      }
      result.push(line);
    }
  }
  return result;
}

// Step 13: SonarJS analysis via eslint-plugin-sonarjs (no server required)
console.log('Step 13: Running SonarJS analysis...');
(function runSonarJS() {
  let output = '';
  try {
    output = execSync('npx eslint src scripts .husky --format stylish', { // NOSONAR
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error) {
    output = (error.stdout || '') + (error.stderr || '');
  }

  const sonarLines = collectSonarJsLines(output);
  const sonarErrors = sonarLines.filter(l => l.includes('  error  ') && l.includes('sonarjs/'));
  const sonarWarnings = sonarLines.filter(l => l.includes('  warning  ') && l.includes('sonarjs/'));

  if (sonarLines.length > 0) {
    console.log(sonarLines.join('\n'));
  }

  if (sonarWarnings.length > 0) {
    log(colors.yellow, `\n⚠️  ${sonarWarnings.length} SonarJS warning(s) detected (non-blocking)`);
  }

  if (sonarErrors.length > 0) {
    printStatus(false, `SonarJS found ${sonarErrors.length} error(s)`);
    log(colors.yellow, '\n💡 Fix SonarJS errors above, or suppress intentional ones with // NOSONAR');
    log(colors.red, '\n❌ Push aborted: Fix all SonarJS errors before pushing');
    console.log('');
    log(colors.cyan, '🤖 AI ASSISTANT — HOW TO FIX THIS:');
    log(colors.cyan, '   Read each sonarjs/ error above \u2014 it names the rule and the file/line.');
    log(colors.cyan, '   Fix the code to satisfy the rule (reduce complexity, fix security flaw, etc.).');
    log(colors.cyan, '   Use `// NOSONAR` on a specific line only when the violation is deliberate and documented.');
    log(colors.cyan, '   ⛔ NEVER bypass with --no-verify, HUSKY=0, or git push --no-verify.');
    process.exit(1);
  }

  const warnSuffix = sonarWarnings.length > 0 ? ` (${sonarWarnings.length} warning(s))` : '';
  printStatus(true, `SonarJS analysis passed${warnSuffix}`);
  console.log('');
})();

// All checks passed
log(colors.green, '✅ All pre-push checks passed!');
log(colors.green, 'Proceeding with push...');
