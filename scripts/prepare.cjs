#!/usr/bin/env node

/**
 * Cross-platform prepare script that installs husky only in local development.
 * Skips husky installation in CI environments to allow publishing without dev dependencies.
 */

const { execSync } = require('child_process');

/**
 * Core logic for husky installation with dependency injection for testability
 * @param {object} deps - Dependencies to inject
 * @param {Function} deps.execSync - Function to execute commands
 * @param {Function} deps.requireResolve - Function to resolve module paths (require.resolve)
 * @param {Function} deps.log - Function for logging
 * @param {Function} deps.error - Function for error logging
 * @param {object} deps.env - Environment variables
 * @returns {number} Exit code (0 = success, 1 = failure)
 */
function prepareHusky(deps = {}) {
  const {
    execSync: exec = execSync,
    requireResolve = require.resolve,
    log = console.log,
    error = console.error,
    env = process.env
  } = deps;

  // Check if we're in a CI environment
  // Only treat 'true' or '1' as truthy to avoid false positives from CI=false or CI=0
  const isCI = env.CI === 'true' || env.CI === '1';

  if (isCI) {
    log('CI environment detected, skipping husky install');
    return 0;
  }

  // Check if husky is available using Node's module resolution
  // This is more robust than checking node_modules/husky directly
  try {
    requireResolve('husky');
  } catch (err) {
    log('Husky not installed (devDependencies may be omitted), skipping husky install');
    return 0;
  }

  try {
    log('Installing husky hooks...');
    // Use --no-install to prevent npx from downloading packages if not found locally
    exec('npx --no-install husky install', { stdio: 'inherit' });
    log('Husky hooks installed successfully');
    return 0;
  } catch (err) {
    error('Failed to install husky hooks:', err.message);
    return 1;
  }
}

// Only execute when run directly (not when required/imported)
if (require.main === module) {
  const exitCode = prepareHusky();
  process.exit(exitCode);
}

module.exports = { prepareHusky };
