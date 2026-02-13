import { describe, it, expect, vi } from 'vitest';
import * as prepareModule from './prepare.cjs';

// Import the function to test
const { prepareHusky } = prepareModule as { prepareHusky: (deps?: Record<string, unknown>) => number };

describe('prepare.cjs', () => {
  // Mock dependencies
  const createMocks = () => ({
    execSync: vi.fn(),
    requireResolve: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    env: {} as Record<string, string>
  });

  it('should skip husky install when CI=true', () => {
    const mocks = createMocks();
    mocks.env.CI = 'true';
    mocks.requireResolve.mockReturnValue('/path/to/husky/index.js');

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('CI environment detected, skipping husky install');
    expect(mocks.execSync).not.toHaveBeenCalled();
    expect(mocks.requireResolve).not.toHaveBeenCalled(); // CI check happens first
  });

  it('should skip husky install when CI=1', () => {
    const mocks = createMocks();
    mocks.env.CI = '1';
    mocks.requireResolve.mockReturnValue('/path/to/husky/index.js');

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('CI environment detected, skipping husky install');
    expect(mocks.execSync).not.toHaveBeenCalled();
    expect(mocks.requireResolve).not.toHaveBeenCalled(); // CI check happens first
  });

  it('should NOT skip husky install when CI=false', () => {
    const mocks = createMocks();
    mocks.env.CI = 'false';
    mocks.requireResolve.mockReturnValue('/path/to/husky/index.js');

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('Installing husky hooks...');
    expect(mocks.log).toHaveBeenCalledWith('Husky hooks installed successfully');
    expect(mocks.log).not.toHaveBeenCalledWith('CI environment detected, skipping husky install');
    expect(mocks.execSync).toHaveBeenCalledWith('npx --no-install husky install', { stdio: 'inherit' });
  });

  it('should NOT skip husky install when CI=0', () => {
    const mocks = createMocks();
    mocks.env.CI = '0';
    mocks.requireResolve.mockReturnValue('/path/to/husky/index.js');

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('Installing husky hooks...');
    expect(mocks.log).toHaveBeenCalledWith('Husky hooks installed successfully');
    expect(mocks.log).not.toHaveBeenCalledWith('CI environment detected, skipping husky install');
    expect(mocks.execSync).toHaveBeenCalledWith('npx --no-install husky install', { stdio: 'inherit' });
  });

  it('should skip husky install when husky is not installed', () => {
    const mocks = createMocks();
    mocks.env = {}; // No CI variable
    mocks.requireResolve.mockImplementation(() => {
      throw new Error('Cannot find module');
    });

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('Husky not installed (devDependencies may be omitted), skipping husky install');
    expect(mocks.execSync).not.toHaveBeenCalled();
  });

  it('should install husky hooks successfully when husky is installed and not in CI', () => {
    const mocks = createMocks();
    mocks.env = {}; // No CI variable
    mocks.requireResolve.mockReturnValue('/path/to/husky/index.js');

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('Installing husky hooks...');
    expect(mocks.log).toHaveBeenCalledWith('Husky hooks installed successfully');
    expect(mocks.execSync).toHaveBeenCalledWith('npx --no-install husky install', { stdio: 'inherit' });
  });

  it('should prioritize CI check over husky availability', () => {
    const mocks = createMocks();
    mocks.env.CI = 'true';
    mocks.requireResolve.mockImplementation(() => {
      throw new Error('Cannot find module');
    });

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(0);
    expect(mocks.log).toHaveBeenCalledWith('CI environment detected, skipping husky install');
    expect(mocks.log).not.toHaveBeenCalledWith(expect.stringContaining('Husky not installed'));
    expect(mocks.requireResolve).not.toHaveBeenCalled(); // CI check happens before husky check
  });

  it('should return exit code 1 when husky install fails', () => {
    const mocks = createMocks();
    mocks.env = {}; // No CI variable
    mocks.requireResolve.mockReturnValue('/path/to/husky/index.js');
    mocks.execSync.mockImplementation(() => {
      throw new Error('Command failed');
    });

    const exitCode = prepareHusky(mocks);

    expect(exitCode).toBe(1);
    expect(mocks.log).toHaveBeenCalledWith('Installing husky hooks...');
    expect(mocks.error).toHaveBeenCalledWith('Failed to install husky hooks:', 'Command failed');
    expect(mocks.log).not.toHaveBeenCalledWith('Husky hooks installed successfully');
  });
});
