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

// Step 1: Run tests
console.log('Step 1: Running tests...');
try {
  execSync('npm test', { stdio: 'pipe' });
  printStatus(true, 'Tests passed');
} catch (error) {
  printStatus(false, 'Tests failed');
  console.log(error.stdout?.toString().slice(-1000) || '');
  log(colors.red, '\n❌ Commit aborted: Tests must pass before committing');
  process.exit(1);
}
console.log('');

// Step 2: Check coverage
console.log('Step 2: Checking code coverage...');
try {
  const coverageOutput = execSync('npx vitest run --coverage', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  // Parse coverage percentage
  const coverageMatch = coverageOutput.match(/All files\s+\|\s+([\d.]+)/);
  const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  
  const THRESHOLD = 80;
  if (coverage < THRESHOLD) {
    printStatus(false, `Coverage too low: ${coverage}% (minimum: ${THRESHOLD}%)`);
    console.log(coverageOutput.split('\n').slice(-20).join('\n'));
    log(colors.red, `\n❌ Commit aborted: Code coverage must be at least ${THRESHOLD}%`);
    process.exit(1);
  }
  
  printStatus(true, `Coverage check passed (${coverage}% >= ${THRESHOLD}%)`);
} catch (error) {
  printStatus(false, 'Coverage check failed');
  console.log(error.stdout?.toString().slice(-1000) || '');
  log(colors.red, '\n❌ Commit aborted: Could not determine coverage');
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

// Step 4: Build check
console.log('Step 4: Building project...');
try {
  const buildOutput = execSync('npm run build', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  // Check for warnings in build output
  if (buildOutput.toLowerCase().includes('warning') || buildOutput.toLowerCase().includes('error')) {
    printStatus(false, 'Build completed with warnings or errors');
    const lines = buildOutput.split('\n');
    const warningLines = lines.filter(line => 
      line.toLowerCase().includes('warning') || line.toLowerCase().includes('error')
    );
    console.log(warningLines.slice(0, 10).join('\n'));
    log(colors.yellow, '\n⚠ Note: Build completed but contains warnings/errors');
    log(colors.yellow, 'These should be addressed before committing');
    // Uncomment next 2 lines to enforce strict build warnings check
    // log(colors.red, '❌ Commit aborted: Resolve all build warnings and errors first');
    // process.exit(1);
  } else {
    printStatus(true, 'Build successful without warnings');
  }
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
