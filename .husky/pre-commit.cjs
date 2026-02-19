#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  HASH_MANIFEST_RELATIVE_PATH,
  getStagedFiles,
  verifyIntegrityAgainstManifest,
} = require('../scripts/template-integrity.cjs');
const { parseVitestRunOutput } = require('../scripts/vitest-output.cjs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function printStatus(passed, message) {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(color, `${icon} ${message}`);
}

console.log('🔍 Running pre-commit checks...\n');

function isBootstrapProject() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    return Boolean(packageJson.typescriptBootstrap?.template);
  } catch (_error) {
    return false;
  }
}

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
      log(colors.red, '\n❌ Commit aborted: Remove test skips (e.g. it.skip/test.skip/describe.skip) before committing');
      process.exit(1);
    }

    if (coverage < THRESHOLD) {
      printStatus(false, `Tests passed but coverage too low: ${coverage}% (minimum: ${THRESHOLD}%)`);
      console.log(testOutput.split('\n').slice(-20).join('\n'));
      log(colors.red, `\n❌ Commit aborted: Code coverage must be at least ${THRESHOLD}%`);
      process.exit(1);
    }

    printStatus(true, `Tests passed with ${coverage}% coverage (>= ${THRESHOLD}%)`);
  } catch (error) {
    printStatus(false, 'Tests failed');
    console.log(error.stdout?.toString().slice(-1000) || '');
    log(colors.red, '\n❌ Commit aborted: Tests must pass before committing');
    process.exit(1);
  }
  console.log('');
}

// Step 0: Always run tests first
runTestsWithCoverage('Step 0');

// Step 1: Enforce scaffold integrity for managed files
console.log('Step 1: Verifying scaffold integrity hashes...');
if (!isBootstrapProject()) {
  printStatus(true, 'Scaffold integrity check skipped (not a TypeScript Bootstrap dependent project)');
  console.log('');
} else {
  try {
    const stagedFiles = getStagedFiles({ targetDir: process.cwd(), exec: execSync });
    const result = verifyIntegrityAgainstManifest({
      targetDir: process.cwd(),
      stagedFiles,
    });

    if (!result.ok) {
      printStatus(false, 'Managed scaffold files were modified');
      console.log('\nFiles with hash mismatches:');
      result.violations.forEach(({ file, reason }) => {
        console.log(`  - ${file} (${reason})`);
      });
      log(colors.yellow, '\n💡 To intentionally accept these changes, run: npm run hash:update');
      log(colors.yellow, '💡 If you did not intend to change managed files, restore them or run: typescript-bootstrap update');
      log(colors.red, '\n❌ Commit aborted: Managed scaffold files cannot be committed with stale hashes');
      process.exit(1);
    }

    printStatus(true, `Scaffold integrity check passed (${result.checkedFiles.length} managed staged file(s) checked)`);
  } catch (error) {
    printStatus(false, 'Scaffold integrity verification failed');
    if (error.message?.includes(HASH_MANIFEST_RELATIVE_PATH)) {
      log(colors.yellow, '\n💡 Hash manifest is missing. Run: typescript-bootstrap update');
    } else {
      console.log(error.message || String(error));
    }
    log(colors.red, '\n❌ Commit aborted: Could not verify managed scaffold file integrity');
    process.exit(1);
  }
  console.log('');
}

// Step 2: Enforce version bump
console.log('Step 2: Enforcing version bump...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  
  // Get the version from the last commit
  let lastVersion;
  try {
    const lastPackageJson = execSync('git show HEAD:package.json', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    lastVersion = JSON.parse(lastPackageJson).version;
  } catch (error) {
    // No previous commit (initial commit) or package.json doesn't exist in HEAD
    // This is fine, skip the check
    printStatus(true, 'Version check skipped (no previous version to compare)');
    console.log('');
  }
  
  if (lastVersion) {
    // Parse semantic versions
    const parseVersion = (v) => v.split('.').map(Number);
    const [currMajor, currMinor, currPatch] = parseVersion(currentVersion);
    const [lastMajor, lastMinor, lastPatch] = parseVersion(lastVersion);
    
    // Check if current version is lower than last version
    const isDowngrade = 
      currMajor < lastMajor ||
      (currMajor === lastMajor && currMinor < lastMinor) ||
      (currMajor === lastMajor && currMinor === lastMinor && currPatch < lastPatch);
    
    const isSameVersion = currentVersion === lastVersion;

    if (isDowngrade) {
      printStatus(false, `Version downgrade detected: ${lastVersion} → ${currentVersion}`);
      log(colors.yellow, '\n💡 Version downgrades are not allowed. Use one of these commands:');
      log(colors.yellow, '   - npm run version:patch (for bug fixes)');
      log(colors.yellow, '   - npm run version:minor (for new features)');
      log(colors.yellow, '   - npm run version:major (for breaking changes)');
      log(colors.red, '\n❌ Commit aborted: Never downgrade package versions');
      process.exit(1);
    }

    if (isSameVersion) {
      printStatus(false, `Version was not bumped: ${lastVersion} → ${currentVersion}`);
      log(colors.yellow, '\n💡 Every commit must bump package version. Use one of these commands:');
      log(colors.yellow, '   - npm run version:patch (for bug fixes)');
      log(colors.yellow, '   - npm run version:minor (for new features)');
      log(colors.yellow, '   - npm run version:major (for breaking changes)');
      log(colors.red, '\n❌ Commit aborted: package.json version must be incremented');
      process.exit(1);
    }
    
    printStatus(true, `Version check passed: ${lastVersion} → ${currentVersion}`);
    console.log('');
  }
} catch (error) {
  // If we can't read package.json, let it fail in later checks
  printStatus(false, 'Could not check version');
  log(colors.red, '\n❌ Commit aborted: Could not read package.json');
  process.exit(1);
}

// Step 3: Verify package-lock.json is in sync
console.log('Step 3: Verifying package-lock.json...');
try {
  // Check if package-lock.json exists
  if (!fs.existsSync('package-lock.json')) {
    printStatus(false, 'package-lock.json not found');
    log(colors.yellow, '\n💡 Run "npm install" to generate package-lock.json');
    log(colors.red, '\n❌ Commit aborted: package-lock.json is required for CI');
    process.exit(1);
  }

  // Verify npm ci would work (validates package-lock.json is in sync)
  execSync('npm ci --dry-run', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  printStatus(true, 'package-lock.json is valid and in sync');
} catch (error) {
  printStatus(false, 'package-lock.json validation failed');
  console.log(error.stdout?.toString().slice(-1000) || error.stderr?.toString().slice(-1000) || '');
  log(colors.yellow, '\n💡 Run "npm install" to fix package-lock.json');
  log(colors.red, '\n❌ Commit aborted: package-lock.json must be valid for npm ci to work in CI');
  process.exit(1);
}
console.log('');

// Step 4: Run ESLint
console.log('Step 4: Running ESLint...');
try {
  execSync('npm run lint', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  printStatus(true, 'ESLint passed - no violations');
} catch (error) {
  printStatus(false, 'ESLint found violations');
  console.log(error.stdout?.toString().slice(-2000) || '');
  log(colors.yellow, '\n💡 Run "npm run lint:fix" to auto-fix some issues');
  log(colors.red, '\n❌ Commit aborted: Fix all ESLint errors before committing');
  process.exit(1);
}
console.log('');

// Step 5: Check code duplication
console.log('Step 5: Checking code duplication...');
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
      log(colors.red, `\n❌ Commit aborted: Code duplication must be at most ${DUPLICATION_THRESHOLD}%`);
      log(colors.yellow, 'Run "npx jscpd src" to see detailed duplication report');
      process.exit(1);
    }
    
    printStatus(true, `Duplication check passed (${duplicationPercentage.toFixed(2)}% <= ${DUPLICATION_THRESHOLD}%)`);
  } else {
    // No report file means no duplication
    printStatus(true, 'Duplication check passed (0.00% <= 1%)');
  }
} catch (error) {
  // jscpd exits with non-zero if duplication exceeds threshold
  const reportPath = path.join(process.cwd(), 'report', 'jscpd-report.json');
  if (fs.existsSync(reportPath)) {
    const reportData = fs.readFileSync(reportPath, 'utf-8');
    const report = JSON.parse(reportData);
    const duplicationPercentage = report.statistics?.total?.percentage || 0;
    
    const DUPLICATION_THRESHOLD = 1;
    printStatus(false, `Code duplication too high: ${duplicationPercentage.toFixed(2)}% (maximum: ${DUPLICATION_THRESHOLD}%)`);
    log(colors.red, `\n❌ Commit aborted: Code duplication must be at most ${DUPLICATION_THRESHOLD}%`);
    log(colors.yellow, 'Run "npx jscpd src" to see detailed duplication report');
    process.exit(1);
  } else {
    printStatus(false, 'Duplication check failed - could not read report');
    log(colors.red, '\n❌ Commit aborted: Could not determine duplication percentage');
    process.exit(1);
  }
}
console.log('');

// Step 6: Check for secrets
console.log('Step 6: Checking for secrets...');
try {
  // Get list of staged files (excluding .husky directory to avoid false positives)
  const stagedFiles = execSync('git diff --cached --name-only', {
    encoding: 'utf-8'
  }).trim().split('\n').filter(f => f && !f.startsWith('.husky/'));

  const secretPatterns = [
    { regex: /_authToken=.+/i, description: 'Auth token' },
    { regex: /password\s*=\s*['"][^'"]+['"]/i, description: 'Password' },
    { regex: /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i, description: 'API key' },
    { regex: /secret[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i, description: 'Secret key' },
    { regex: /token\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i, description: 'Token' },
    { regex: /bearer\s+[a-zA-Z0-9\-._~+\/]+=*/i, description: 'Bearer token' },
    { regex: /ghp_[a-zA-Z0-9]{36}/i, description: 'GitHub Personal Access Token' },
    { regex: /gho_[a-zA-Z0-9]{36}/i, description: 'GitHub OAuth token' },
    { regex: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/i, description: 'GitHub fine-grained PAT' },
  ];

  const secretsFound = [];

  for (const file of stagedFiles) {
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
    log(colors.yellow, '\n💡 Never commit secrets, tokens, or passwords');
    log(colors.yellow, 'Use environment variables like ${GITHUB_TOKEN} instead');
    log(colors.red, '\n❌ Commit aborted: Remove all secrets before committing');
    process.exit(1);
  }

  printStatus(true, 'No secrets detected');
} catch (error) {
  if (error.code !== 1) {
    // Don't fail on git diff errors (e.g., no staged files)
    printStatus(true, 'No secrets detected (no staged files)');
  } else {
    throw error;
  }
}
console.log('');

// Step 7: TypeScript type check
console.log('Step 7: TypeScript type checking...');
try {
  execSync('npx tsc --noEmit', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  printStatus(true, 'TypeScript type check passed');
} catch (error) {
  printStatus(false, 'TypeScript type errors found');
  console.log(error.stdout?.toString() || '');
  log(colors.red, '\n❌ Commit aborted: Fix all TypeScript errors before committing');
  process.exit(1);
}
console.log('');

// Step 8: Build check
console.log('Step 8: Building project...');
try {
  execSync('npm run build', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  printStatus(true, 'Build successful');
} catch (error) {
  printStatus(false, 'Build failed');
  console.log(error.stdout?.toString().slice(-1000) || '');
  log(colors.red, '\n❌ Commit aborted: Build must succeed without errors');
  process.exit(1);
}
console.log('');

// All checks passed
log(colors.green, '✅ All pre-commit checks passed!');
log(colors.green, 'Proceeding with commit...');
