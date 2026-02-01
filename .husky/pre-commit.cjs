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

// Step 4: Check for hardcoded strings
console.log('Step 4: Checking for hardcoded strings in JSX...');
try {
  const srcDir = path.join(process.cwd(), 'src');
  const hardcodedStrings = [];
  
  // Patterns that indicate hardcoded strings (excluding test files)
  const patterns = [
    // JSX text content between tags: >Some Text<
    { regex: />([A-Z][a-z]+(?:\s+[a-z]+)+)</g, description: 'Text between JSX tags' },
    // Button/label text: >Submit<, >Cancel<, etc.
    { regex: />([A-Z][a-z]{2,})</g, description: 'Single word in JSX' },
    // title="English text"
    { regex: /title="([A-Z][^"]+)"/g, description: 'Hardcoded title attribute' },
    // aria-label="English text"  
    { regex: /aria-label="([A-Z][^"]+)"/g, description: 'Hardcoded aria-label' },
    // placeholder="English text"
    { regex: /placeholder="([A-Z][^"]+)"/g, description: 'Hardcoded placeholder' },
    // label="English text"
    { regex: /label="([A-Z][^"]+)"/g, description: 'Hardcoded label' },
    // Template literals with text (Portuguese/Spanish accented chars or common words)
    { regex: /`([^`]*[a-záàâãéèêíìîóòôõúùûçñ][^`]*)`/gi, description: 'Hardcoded text in template literal' },
    // String literals with accented characters (Portuguese/Spanish)
    { regex: /'([^']*[áàâãéèêíìîóòôõúùûçñÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ][^']*)'/g, description: 'Hardcoded accented string' },
    { regex: /"([^"]*[áàâãéèêíìîóòôõúùûçñÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇÑ][^"]*)"/g, description: 'Hardcoded accented string' },
  ];
  
  // Whitelist - patterns to ignore
  const whitelist = [
    /^[A-Z]$/, // Single capital letters
    /^T$|^F$/, // True/False abbreviations
    /^KaTeX/, // KaTeX references
    /^[A-Z][a-z]+\.[a-z]+/, // File names like Component.tsx
    /^Error:?$/, // Error prefix (used with t())
    /^Typography$|^Box$|^Button$|^Paper$|^Container$/, // MUI components
    /^IconButton$|^TextField$|^Dialog$|^Chip$|^Alert$/, // More MUI
    /^InlineMath$|^BlockMath$/, // KaTeX components
    /^\$\{/, // Template literal interpolations starting with ${
    /transform:|opacity:|filter:|scale\(|rotate\(|translateX|translateY/, // CSS properties
    /^\s*\d+%\s*\{/, // CSS keyframe percentages like "0% {"
    /result-value|true|false/, // CSS class names with conditional
    /^(star|fw|emoji|confetti|piece)-\$\{/, // React key patterns
    /gradient|transparent|rgba|rgb|#[0-9a-fA-F]/, // CSS colors and gradients
    /^\d+\s+\d+px\s+\$\{/, // CSS box-shadow patterns
    /^0\s+0\s+\d+px\s+\$\{/, // CSS box-shadow "0 0 10px ${color}"
  ];
  
  function isWhitelisted(text) {
    return whitelist.some(pattern => pattern.test(text.trim()));
  }
  
  function scanFile(filePath) {
    // Skip test files
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.relative(srcDir, filePath);
    
    patterns.forEach(({ regex, description }) => {
      let match;
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(content)) !== null) {
        const text = match[1];
        if (text && text.length > 1 && !isWhitelisted(text)) {
          // Get line number
          const lines = content.substring(0, match.index).split('\n');
          const lineNum = lines.length;
          hardcodedStrings.push({
            file: fileName,
            line: lineNum,
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            type: description,
          });
        }
      }
    });
  }
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        scanFile(fullPath);
      }
    });
  }
  
  scanDirectory(srcDir);
  
  if (hardcodedStrings.length > 0) {
    printStatus(false, `Found ${hardcodedStrings.length} potential hardcoded string(s)`);
    console.log('\nHardcoded strings found:');
    hardcodedStrings.slice(0, 10).forEach(({ file, line, text, type }) => {
      console.log(`  ${file}:${line} - "${text}" (${type})`);
    });
    if (hardcodedStrings.length > 10) {
      console.log(`  ... and ${hardcodedStrings.length - 10} more`);
    }
    log(colors.yellow, '\n💡 Use t() from react-i18next for all user-visible text');
    log(colors.red, '\n❌ Commit aborted: All strings should use i18n translations');
    process.exit(1);
  }
  
  printStatus(true, 'No hardcoded strings detected');
  
  // Check translation file key consistency
  console.log('');
  console.log('Step 4b: Checking translation file consistency...');
  
  const localesDir = path.join(srcDir, 'i18n', 'locales');
  const translationFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
  
  if (translationFiles.length < 2) {
    printStatus(true, 'Only one translation file found, skipping consistency check');
  } else {
    const translations = {};
    const allKeys = new Set();
    
    // Load all translation files
    translationFiles.forEach(file => {
      const filePath = path.join(localesDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      translations[file] = Object.keys(content);
      translations[file].forEach(key => allKeys.add(key));
    });
    
    // Check for missing keys in each file
    const missingKeys = {};
    let hasMissing = false;
    
    translationFiles.forEach(file => {
      const fileKeys = new Set(translations[file]);
      const missing = [...allKeys].filter(key => !fileKeys.has(key));
      if (missing.length > 0) {
        missingKeys[file] = missing;
        hasMissing = true;
      }
    });
    
    if (hasMissing) {
      printStatus(false, 'Translation files have mismatched keys');
      console.log('\nMissing translation keys:');
      Object.entries(missingKeys).forEach(([file, keys]) => {
        console.log(`  ${file}:`);
        keys.slice(0, 5).forEach(key => console.log(`    - ${key}`));
        if (keys.length > 5) {
          console.log(`    ... and ${keys.length - 5} more`);
        }
      });
      log(colors.yellow, '\n💡 All translation files must have the same keys');
      log(colors.red, '\n❌ Commit aborted: Translation files are out of sync');
      process.exit(1);
    }
    
    printStatus(true, `Translation files in sync (${allKeys.size} keys across ${translationFiles.length} files)`);
  }
} catch (error) {
  printStatus(false, 'Hardcoded string check failed');
  console.log(error.message || error);
  log(colors.red, '\n❌ Commit aborted: Could not check for hardcoded strings');
  process.exit(1);
}
console.log('');

// Step 5: Build check
console.log('Step 5: Building project...');
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
