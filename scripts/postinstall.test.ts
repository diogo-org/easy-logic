import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
const postinstallModule = require('./postinstall.cjs');

const { autoInitOnInstall, hasDependency, isFreshDirectory } = postinstallModule as {
  autoInitOnInstall: (deps?: Record<string, unknown>) => Promise<number>;
  hasDependency: (packageJson: Record<string, unknown>) => boolean;
  isFreshDirectory: (entries: string[]) => boolean;
};

describe('postinstall.cjs', () => {
  const PACKAGE_NAME = '@diogo-org/typescript-bootstrap';
  const DEFAULT_TEMPLATE = 'typescript';

  function createTempProjectDir(packageJson: Record<string, unknown>): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'postinstall-auto-init-'));
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      `${JSON.stringify(packageJson, null, 2)}\n`,
      'utf-8'
    );
    return tempDir;
  }

  function cleanupTempDir(tempDir: string): void {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  async function runTest(
    setup: () => string,
    opts: {
      env?: Record<string, string>;
      expectCalled?: boolean;
      expectedArgs?: Record<string, unknown>;
      log?: () => void;
      cwd?: () => string;
    } = {}
  ): Promise<void> {
    const tempDir = setup();
    const bootstrapProject = vi.fn(async () => undefined);
    const mockLog = opts.log ? vi.fn(opts.log) : undefined;
    const mockCwd = opts.cwd ? vi.fn(opts.cwd) : undefined;

    try {
      const exitCode = await autoInitOnInstall({
        env: { INIT_CWD: tempDir, ...opts.env },
        bootstrapProject,
        log: mockLog,
        cwd: mockCwd,
      });

      expect(exitCode).toBe(0);

      if (opts.expectCalled && opts.expectedArgs) {
        expect(bootstrapProject).toHaveBeenCalledWith({ ...opts.expectedArgs, targetDir: tempDir });
      } else if (opts.expectCalled === false) {
        expect(bootstrapProject).not.toHaveBeenCalled();
      }

      if (mockCwd && opts.env && !opts.env.INIT_CWD) {
        expect(mockCwd).toHaveBeenCalled();
      }
    } finally {
      cleanupTempDir(tempDir);
    }
  }

  function withPackageJson(packageJson: Record<string, unknown>): () => string {
    return () => createTempProjectDir(packageJson);
  }

  function withInvalidJson(): () => string {
    return () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'postinstall-auto-init-'));
      fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json{', 'utf-8');
      return tempDir;
    };
  }

  function withNoPackageJson(): () => string {
    return () => fs.mkdtempSync(path.join(os.tmpdir(), 'postinstall-auto-init-'));
  }

  function withExtraFile(packageJson: Record<string, unknown>, filename: string): () => string {
    return () => {
      const tempDir = createTempProjectDir(packageJson);
      fs.writeFileSync(path.join(tempDir, filename), 'content', 'utf-8');
      return tempDir;
    };
  }

  async function runErrorTest(
    packageJson: Record<string, unknown>,
    errorToThrow: unknown,
    expectedErrorMessage: string
  ): Promise<void> {
    const tempDir = createTempProjectDir(packageJson);
    const bootstrapProject = vi.fn(async () => {
      throw errorToThrow;
    });
    const mockError = vi.fn();

    try {
      const exitCode = await autoInitOnInstall({
        env: { INIT_CWD: tempDir },
        bootstrapProject,
        error: mockError,
      });

      expect(exitCode).toBe(1);
      expect(mockError).toHaveBeenCalledWith(
        'TypeScript Bootstrap operation failed:',
        expectedErrorMessage
      );
    } finally {
      cleanupTempDir(tempDir);
    }
  }

  it('runs auto-init in a fresh project directory with package dependency', async () => {
    await runTest(
      withPackageJson({
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
      }),
      {
        expectCalled: true,
        expectedArgs: {
          projectName: 'my-app',
          projectTitle: 'my-app',
          skipPrompts: true,
          template: 'typescript',
        },
      }
    );
  });

  it('skips auto-init when install is global', async () => {
    await runTest(
      withPackageJson({
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
      }),
      {
        env: { npm_config_global: 'true' },
        expectCalled: false,
      }
    );
  });

  it('skips auto-init when TS_BOOTSTRAP_AUTO_INIT is false', async () => {
    await runTest(
      withPackageJson({
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
      }),
      {
        env: { TS_BOOTSTRAP_AUTO_INIT: 'false' },
        expectCalled: false,
      }
    );
  });

  it('uses cwd() when INIT_CWD is not set', async () => {
    const tempDir = createTempProjectDir({
      name: 'my-app',
      version: '1.0.0',
      dependencies: { [PACKAGE_NAME]: '^1.0.0' },
    });

    const bootstrapProject = vi.fn(async () => undefined);
    const mockCwd = vi.fn(() => tempDir);

    try {
      const exitCode = await autoInitOnInstall({
        env: {}, // No INIT_CWD
        bootstrapProject,
        cwd: mockCwd,
      });

      expect(exitCode).toBe(0);
      expect(mockCwd).toHaveBeenCalled();
      expect(bootstrapProject).toHaveBeenCalled();
    } finally {
      cleanupTempDir(tempDir);
    }
  });

  it('skips when package.json is invalid JSON', async () => {
    await runTest(withInvalidJson(), { expectCalled: false });
  });

  it('skips when package.json does not exist', async () => {
    await runTest(withNoPackageJson(), { expectCalled: false });
  });

  it('skips when package does not have bootstrap dependency', async () => {
    await runTest(
      withPackageJson({
        name: 'my-app',
        version: '1.0.0',
        dependencies: { 'some-other-package': '^1.0.0' },
      }),
      { expectCalled: false }
    );
  });

  it('skips auto-init when directory is not fresh', async () => {
    await runTest(
      withExtraFile(
        {
          name: 'my-app',
          version: '1.0.0',
          dependencies: { [PACKAGE_NAME]: '^1.0.0' },
        },
        'notes.txt'
      ),
      { expectCalled: false }
    );
  });

  it('respects TS_BOOTSTRAP_TEMPLATE env when provided', async () => {
    await runTest(
      withPackageJson({
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
      }),
      {
        env: { TS_BOOTSTRAP_TEMPLATE: 'react' },
        expectCalled: true,
        expectedArgs: {
          projectName: 'my-app',
          projectTitle: 'my-app',
          skipPrompts: true,
          template: 'react',
        },
      }
    );
  });

  it('runs auto-update when project is already initialized', async () => {
    await runTest(
      withPackageJson({
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
        typescriptBootstrap: { template: 'typescript' },
      }),
      {
        expectCalled: true,
        expectedArgs: {
          projectName: 'my-app',
          projectTitle: 'my-app',
          skipPrompts: true,
          template: 'typescript',
        },
      }
    );
  });

  it('updates initialized project even when directory is not fresh', async () => {
    await runTest(
      withExtraFile(
        {
          name: 'my-app',
          version: '1.0.0',
          dependencies: { [PACKAGE_NAME]: '^1.0.0' },
          typescriptBootstrap: { template: 'react' },
        },
        'notes.txt'
      ),
      {
        expectCalled: true,
        expectedArgs: {
          projectName: 'my-app',
          projectTitle: 'my-app',
          skipPrompts: true,
          template: 'react',
        },
      }
    );
  });

  it('returns exit code 1 when bootstrap operation fails', async () => {
    await runErrorTest(
      {
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
      },
      new Error('Bootstrap operation failed'),
      'Bootstrap operation failed'
    );
  });

  it('handles non-Error exceptions during bootstrap', async () => {
    await runErrorTest(
      {
        name: 'my-app',
        version: '1.0.0',
        dependencies: { [PACKAGE_NAME]: '^1.0.0' },
      },
      'String error', // Non-Error exception
      'Unknown error'
    );
  });

  describe('Helper functions', () => {
    it('hasDependency returns true when package is in dependencies', () => {
      const packageJson = {
        dependencies: {
          [PACKAGE_NAME]: '^1.0.0',
        },
      };
      expect(hasDependency(packageJson)).toBe(true);
    });

    it('hasDependency returns true when package is in devDependencies', () => {
      const packageJson = {
        devDependencies: {
          [PACKAGE_NAME]: '^1.0.0',
        },
      };
      expect(hasDependency(packageJson)).toBe(true);
    });

    it('hasDependency returns true when package is in optionalDependencies', () => {
      const packageJson = {
        optionalDependencies: {
          [PACKAGE_NAME]: '^1.0.0',
        },
      };
      expect(hasDependency(packageJson)).toBe(true);
    });

    it('hasDependency returns false when package is not present', () => {
      const packageJson = {
        dependencies: {
          'other-package': '^1.0.0',
        },
      };
      expect(hasDependency(packageJson)).toBe(false);
    });

    it('hasDependency handles invalid dependency groups gracefully', () => {
      const packageJson = {
        dependencies: null,
        devDependencies: 'invalid',
      };
      expect(hasDependency(packageJson)).toBe(false);
    });

    it('isFreshDirectory returns true for fresh directory', () => {
      const entries = ['package.json', 'node_modules', 'package-lock.json'];
      expect(isFreshDirectory(entries)).toBe(true);
    });

    it('isFreshDirectory returns false for non-fresh directory', () => {
      const entries = ['package.json', 'src', 'README.md'];
      expect(isFreshDirectory(entries)).toBe(false);
    });

    it('calls bootstrapProject with correct args when metadata exists', async () => {
      await runTest(
        withPackageJson({
          name: 'real-loader-test',
          version: '1.0.0',
          dependencies: { [PACKAGE_NAME]: '^1.0.0' },
          typescriptBootstrap: { template: 'typescript' },
        }),
        {
          expectCalled: true,
          expectedArgs: {
            projectName: 'real-loader-test',
            projectTitle: 'real-loader-test',
            skipPrompts: true,
            template: 'typescript',
          },
        }
      );
    });
  });
});
