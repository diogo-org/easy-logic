#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HASH_ALGORITHM = 'sha256';
const HASH_MANIFEST_RELATIVE_PATH = '.github/typescript-bootstrap-hashes.json';
const MANIFEST_VERSION = 1;

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/').replace(/^\.\//, '');
}

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash(HASH_ALGORITHM).update(content).digest('hex');
}

function uniqueSortedPaths(paths) {
  return Array.from(
    new Set(paths.map((entry) => normalizeRelativePath(entry)).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));
}

function writeIntegrityManifest({
  targetDir = process.cwd(),
  managedFiles,
  manifestRelativePath = HASH_MANIFEST_RELATIVE_PATH,
}) {
  if (!Array.isArray(managedFiles)) {
    throw new Error('managedFiles must be an array');
  }

  const normalizedManagedFiles = uniqueSortedPaths(managedFiles)
    .filter((file) => file !== normalizeRelativePath(manifestRelativePath))
    .filter((file) => fs.existsSync(path.join(targetDir, file)));

  const hashes = {};
  for (const relativeFile of normalizedManagedFiles) {
    hashes[relativeFile] = getFileHash(path.join(targetDir, relativeFile));
  }

  const manifest = {
    version: MANIFEST_VERSION,
    algorithm: HASH_ALGORITHM,
    generatedAt: new Date().toISOString(),
    managedFiles: normalizedManagedFiles,
    hashes,
  };

  const manifestPath = path.join(targetDir, manifestRelativePath);
  const manifestDirectory = path.dirname(manifestPath);

  if (!fs.existsSync(manifestDirectory)) {
    fs.mkdirSync(manifestDirectory, { recursive: true });
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  return manifest;
}

function readIntegrityManifest({
  targetDir = process.cwd(),
  manifestRelativePath = HASH_MANIFEST_RELATIVE_PATH,
}) {
  const manifestPath = path.join(targetDir, manifestRelativePath);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Hash manifest not found at ${manifestRelativePath}`);
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function getStagedFiles({ targetDir = process.cwd(), exec = execSync } = {}) {
  const output = exec('git diff --cached --name-only', {
    cwd: targetDir,
    encoding: 'utf-8',
    stdio: 'pipe',
  }).trim();

  if (!output) {
    return [];
  }

  return output.split('\n').map((entry) => normalizeRelativePath(entry)).filter(Boolean);
}

function verifyIntegrityAgainstManifest({
  targetDir = process.cwd(),
  stagedFiles,
  manifestRelativePath = HASH_MANIFEST_RELATIVE_PATH,
}) {
  const manifest = readIntegrityManifest({ targetDir, manifestRelativePath });
  const normalizedStagedFiles = uniqueSortedPaths(stagedFiles || []);
  const managedSet = new Set(uniqueSortedPaths(manifest.managedFiles || []));
  const filesToCheck = normalizedStagedFiles.filter((file) => managedSet.has(file));
  const violations = [];

  for (const relativeFile of filesToCheck) {
    const expectedHash = manifest.hashes?.[relativeFile];
    if (!expectedHash) {
      violations.push({ file: relativeFile, reason: 'missing-hash' });
      continue;
    }

    const absolutePath = path.join(targetDir, relativeFile);
    if (!fs.existsSync(absolutePath)) {
      violations.push({ file: relativeFile, reason: 'missing-file' });
      continue;
    }

    const currentHash = getFileHash(absolutePath);
    if (currentHash !== expectedHash) {
      violations.push({ file: relativeFile, reason: 'hash-mismatch' });
    }
  }

  return {
    ok: violations.length === 0,
    checkedFiles: filesToCheck,
    violations,
  };
}

function refreshIntegrityManifest({
  targetDir = process.cwd(),
  manifestRelativePath = HASH_MANIFEST_RELATIVE_PATH,
}) {
  const manifest = readIntegrityManifest({ targetDir, manifestRelativePath });
  return writeIntegrityManifest({
    targetDir,
    managedFiles: manifest.managedFiles || [],
    manifestRelativePath,
  });
}

if (require.main === module) {
  const command = process.argv[2] || 'check';

  if (command === 'update') {
    try {
      const manifest = refreshIntegrityManifest();
      console.log(`Updated hash manifest for ${manifest.managedFiles.length} managed files.`);
      process.exit(0);
    } catch (error) {
      console.error(`Failed to update hash manifest: ${error.message}`);
      process.exit(1);
    }
  }

  if (command === 'check') {
    try {
      const stagedFiles = getStagedFiles();
      const result = verifyIntegrityAgainstManifest({ stagedFiles });
      if (!result.ok) {
        console.error('Scaffold integrity check failed for staged managed files:');
        result.violations.forEach((violation) => {
          console.error(` - ${violation.file} (${violation.reason})`);
        });
        process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      console.error(`Failed to verify scaffold integrity: ${error.message}`);
      process.exit(1);
    }
  }

  console.error(`Unknown command: ${command}. Use "check" or "update".`);
  process.exit(1);
}

module.exports = {
  HASH_ALGORITHM,
  HASH_MANIFEST_RELATIVE_PATH,
  getStagedFiles,
  refreshIntegrityManifest,
  verifyIntegrityAgainstManifest,
  writeIntegrityManifest,
};
