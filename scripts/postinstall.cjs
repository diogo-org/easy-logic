#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const GLOBAL_INSTALL_ENABLED_VALUE = 'true';
const CI_ENABLED_VALUES = new Set(['true', '1']);
const AUTO_INIT_DISABLED_VALUE = 'false';
const DEFAULT_TEMPLATE = 'typescript';
const VALID_TEMPLATES = new Set(['typescript', 'react']);
const PACKAGE_NAMES = [
  '@diogo-org/typescript-bootstrap',
];
const FRESH_DIRECTORY_ALLOWED_ENTRIES = new Set([
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'node_modules',
  '.npmrc',
]);

function hasDependency(packageJson) {
  const dependencyGroups = [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
  ];

  return dependencyGroups.some((group) => {
    if (!group || typeof group !== 'object') {
      return false;
    }

    return PACKAGE_NAMES.some((packageName) => Object.prototype.hasOwnProperty.call(group, packageName));
  });
}

function isFreshDirectory(entries) {
  return entries.every((entry) => FRESH_DIRECTORY_ALLOWED_ENTRIES.has(entry));
}

async function loadCreateOrUpdate() {
  const distEntry = path.join(__dirname, '..', 'dist', 'index.js');
  const distModuleUrl = pathToFileURL(distEntry).href;
  const distModule = await import(distModuleUrl);
  return distModule.createOrUpdate;
}

async function autoInitOnInstall(deps = {}) {
  const {
    env = process.env,
    existsSync = fs.existsSync,
    readFileSync = fs.readFileSync,
    readdirSync = fs.readdirSync,
    cwd = process.cwd,
    basename = path.basename,
    join = path.join,
    log = console.log,
    error = console.error,
  } = deps;

  const bootstrapProject = deps.bootstrapProject || (async (options) => {
    const createOrUpdate = await loadCreateOrUpdate();
    return createOrUpdate(options);
  });

  if (CI_ENABLED_VALUES.has(env.CI)) {
    return 0;
  }

  if (env.npm_config_global === GLOBAL_INSTALL_ENABLED_VALUE) {
    log('Global install detected, skipping TypeScript Bootstrap auto-initialization');
    return 0;
  }

  if (env.TS_BOOTSTRAP_AUTO_INIT === AUTO_INIT_DISABLED_VALUE) {
    log('TS_BOOTSTRAP_AUTO_INIT=false, skipping TypeScript Bootstrap auto-initialization');
    return 0;
  }

  const targetDir = env.INIT_CWD || cwd();
  const packageJsonPath = join(targetDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return 0;
  }

  let packageJson;

  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  } catch {
    log('Unable to parse target package.json, skipping TypeScript Bootstrap auto-initialization');
    return 0;
  }

  if (!hasDependency(packageJson)) {
    return 0;
  }

  const hasBootstrapMetadata = Boolean(packageJson.typescriptBootstrap);
  const targetEntries = readdirSync(targetDir);
  const isFresh = isFreshDirectory(targetEntries);

  // Skip if directory is not fresh and has no bootstrap metadata (safety: avoid breaking existing projects)
  if (!hasBootstrapMetadata && !isFresh) {
    log('Target directory is not fresh, skipping TypeScript Bootstrap auto-initialization');
    return 0;
  }

  // For existing projects with metadata, use the template from metadata
  // For fresh installs, use env var or default template
  const requestedTemplate = hasBootstrapMetadata
    ? packageJson.typescriptBootstrap.template
    : (env.TS_BOOTSTRAP_TEMPLATE || DEFAULT_TEMPLATE);
  const template = VALID_TEMPLATES.has(requestedTemplate)
    ? requestedTemplate
    : DEFAULT_TEMPLATE;
  const projectName = typeof packageJson.name === 'string' && packageJson.name.trim().length > 0
    ? packageJson.name
    : basename(targetDir);
  const projectTitle = typeof packageJson.description === 'string' && packageJson.description.trim().length > 0
    ? packageJson.description
    : projectName;

  try {
    const action = hasBootstrapMetadata ? 'Updating' : 'Initializing';
    log(`${action} TypeScript Bootstrap project automatically...`);
    
    await bootstrapProject({
      projectName,
      projectTitle,
      targetDir,
      template,
      skipPrompts: true,
    });
    
    const completed = hasBootstrapMetadata ? 'auto-update' : 'auto-initialization';
    log(`TypeScript Bootstrap ${completed} completed`);
    return 0;
  } catch (bootstrapError) {
    const message = bootstrapError instanceof Error
      ? bootstrapError.message
      : 'Unknown error';

    error('TypeScript Bootstrap operation failed:', message);
    return 1;
  }
}

if (require.main === module) {
  autoInitOnInstall().then((exitCode) => {
    process.exit(exitCode);
  });
}

module.exports = {
  autoInitOnInstall,
  hasDependency,
  isFreshDirectory,
  loadCreateOrUpdate,
};
