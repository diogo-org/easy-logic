#!/usr/bin/env node
/**
 * safe-commit.cjs
 *
 * Wrapper around `git commit` that enforces pre-commit checks.
 * Rejects any attempt to use --no-verify, which would bypass quality gates.
 *
 * Usage (added as npm script "commit"):
 *   npm run commit -- -m "your message"
 *
 * AI NOTICE: Always use `npm run commit` instead of `git commit`.
 * NEVER use `git commit --no-verify`. This wrapper enforces that rule.
 */

'use strict';

const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);

const NO_VERIFY_FLAGS = ['--no-verify', '-n'];

const usedBypass = args.some(arg => NO_VERIFY_FLAGS.includes(arg));

if (usedBypass) {
  console.error('\x1b[31m✗ --no-verify is not allowed in this project.\x1b[0m');
  console.error('\x1b[33m');
  console.error('  Pre-commit checks are mandatory and protect code quality.');
  console.error('  If the checks are failing, fix the issues instead of bypassing them.');
  console.error('');
  console.error('  AI ASSISTANTS: You must fix ALL issues reported by pre-commit.');
  console.error('  Do not use --no-verify or HUSKY=0 to bypass checks.');
  console.error('\x1b[0m');
  process.exit(1);
}

// Detect HUSKY=0 in the environment — this would silently skip all hooks
// even if safe-commit invokes git, so we must refuse to proceed.
if (process.env.HUSKY === '0') {
  console.error('\x1b[31m✗ HUSKY=0 is not allowed in this project.\x1b[0m');
  console.error('\x1b[33m');
  console.error('  Setting HUSKY=0 disables all git hooks and bypasses quality gates.');
  console.error('  If pre-commit is failing, fix the root cause instead of disabling hooks.');
  console.error('');
  console.error('  Every commit — including merge commits — must pass all pre-commit gates.');
  console.error('  For merge commits: resolve conflicts, bump the version, then commit normally.');
  console.error('\x1b[0m');
  process.exit(1);
}

try {
  const result = spawnSync('git', ['commit', ...args], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} catch {
  process.exit(1);
}
