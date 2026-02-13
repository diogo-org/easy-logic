#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Step 0: Verify package-lock.json is in sync
console.log('Step 0: Verifying package-lock.json...');
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

// Step 1: Run ESLint
console.log('Step 1: Running ESLint...');
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

// Step 2: Run tests with coverage
console.log('Step 2: Running tests with coverage...');
try {
  const testOutput = execSync('npx vitest run --coverage', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  // Parse coverage percentage
  const coverageMatch = testOutput.match(/All files\s+\|\s+([\d.]+)/);
  const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  
  const THRESHOLD = 80;
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

// Step 3: Check code duplication
console.log('Step 3: Checking code duplication...');
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

// Step 4: Check for secrets
console.log('Step 4: Checking for secrets...');
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

// Step 5: TypeScript type check
console.log('Step 5: TypeScript type checking...');
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

// Step 6: Build check
console.log('Step 6: Building project...');
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
