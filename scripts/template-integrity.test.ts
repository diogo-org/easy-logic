import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
const integrityModule = require('./template-integrity.cjs');

const {
  HASH_MANIFEST_RELATIVE_PATH,
  verifyIntegrityAgainstManifest,
  writeIntegrityManifest,
} = integrityModule as {
  HASH_MANIFEST_RELATIVE_PATH: string;
  verifyIntegrityAgainstManifest: (options: {
    targetDir?: string;
    stagedFiles?: string[];
    manifestRelativePath?: string;
  }) => {
    ok: boolean;
    checkedFiles: string[];
    violations: Array<{ file: string; reason: string }>;
  };
  writeIntegrityManifest: (options: {
    targetDir?: string;
    managedFiles: string[];
    manifestRelativePath?: string;
  }) => {
    algorithm: string;
    managedFiles: string[];
    hashes: Record<string, string>;
  };
};

describe('template-integrity.cjs', () => {
  const managedFiles = ['eslint.config.js', '.husky/pre-commit.cjs'];

  it('writes integrity manifest with managed files and hashes', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integrity-write-'));

    try {
      fs.mkdirSync(path.join(tempDir, '.husky'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'eslint.config.js'), 'export default []\n', 'utf-8');
      fs.writeFileSync(path.join(tempDir, '.husky', 'pre-commit.cjs'), 'console.log("hook")\n', 'utf-8');

      const manifest = writeIntegrityManifest({
        targetDir: tempDir,
        managedFiles,
      });

      const manifestPath = path.join(tempDir, HASH_MANIFEST_RELATIVE_PATH);
      expect(fs.existsSync(manifestPath)).toBe(true);
      expect(manifest.algorithm).toBe('sha256');
      expect(manifest.managedFiles).toEqual([...managedFiles].sort((left, right) => left.localeCompare(right)));
      expect(typeof manifest.hashes['eslint.config.js']).toBe('string');
      expect(typeof manifest.hashes['.husky/pre-commit.cjs']).toBe('string');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fails verification when staged managed file hash does not match', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integrity-verify-fail-'));

    try {
      fs.mkdirSync(path.join(tempDir, '.husky'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'eslint.config.js'), 'export default []\n', 'utf-8');
      fs.writeFileSync(path.join(tempDir, '.husky', 'pre-commit.cjs'), 'console.log("hook")\n', 'utf-8');

      writeIntegrityManifest({
        targetDir: tempDir,
        managedFiles,
      });

      fs.writeFileSync(path.join(tempDir, 'eslint.config.js'), 'export default [1]\n', 'utf-8');

      const result = verifyIntegrityAgainstManifest({
        targetDir: tempDir,
        stagedFiles: ['eslint.config.js'],
      });

      expect(result.ok).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].file).toBe('eslint.config.js');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('passes verification when staged files are unmanaged', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integrity-verify-pass-'));

    try {
      fs.mkdirSync(path.join(tempDir, '.husky'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'eslint.config.js'), 'export default []\n', 'utf-8');
      fs.writeFileSync(path.join(tempDir, '.husky', 'pre-commit.cjs'), 'console.log("hook")\n', 'utf-8');
      fs.writeFileSync(path.join(tempDir, 'src', 'main.ts'), 'console.log("ok")\n', 'utf-8');

      writeIntegrityManifest({
        targetDir: tempDir,
        managedFiles,
      });

      const result = verifyIntegrityAgainstManifest({
        targetDir: tempDir,
        stagedFiles: ['src/main.ts'],
      });

      expect(result.ok).toBe(true);
      expect(result.violations).toHaveLength(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
