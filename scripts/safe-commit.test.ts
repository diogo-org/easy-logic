import { describe, it, expect } from 'vitest';

// The bypass flags checked by safe-commit.cjs
const NO_VERIFY_FLAGS = ['--no-verify', '-n'];

function wouldBypass(args: string[]): boolean {
  return args.some(arg => NO_VERIFY_FLAGS.includes(arg));
}

// HUSKY=0 detection logic mirrored from safe-commit.cjs
function wouldBypassHusky(env: Record<string, string | undefined>): boolean {
  return env['HUSKY'] === '0';
}

describe('safe-commit bypass detection', () => {
  it('should detect --no-verify flag', () => {
    expect(wouldBypass(['--no-verify', '-m', 'test message'])).toBe(true);
  });

  it('should detect -n shorthand flag', () => {
    expect(wouldBypass(['-n', '-m', 'test message'])).toBe(true);
  });

  it('should allow normal commit arguments', () => {
    expect(wouldBypass(['-m', 'feat: add new feature'])).toBe(false);
  });

  it('should allow commit with --amend', () => {
    expect(wouldBypass(['--amend', '--no-edit'])).toBe(false);
  });

  it('should allow empty args', () => {
    expect(wouldBypass([])).toBe(false);
  });

  it('should not treat -no-verify (single dash) as bypass', () => {
    // -no-verify is not the same as --no-verify or -n
    expect(wouldBypass(['-no-verify'])).toBe(false);
  });

  it('should detect --no-verify anywhere in the argument list', () => {
    expect(wouldBypass(['-m', 'fix: something', '--no-verify'])).toBe(true);
  });

  it('should detect -n anywhere in the argument list', () => {
    expect(wouldBypass(['-m', 'fix: something', '-n'])).toBe(true);
  });
});

describe('safe-commit HUSKY=0 detection', () => {
  it('should block when HUSKY=0 is set', () => {
    expect(wouldBypassHusky({ HUSKY: '0' })).toBe(true);
  });

  it('should allow when HUSKY is not set', () => {
    expect(wouldBypassHusky({})).toBe(false);
  });

  it('should allow when HUSKY is set to a non-zero value', () => {
    expect(wouldBypassHusky({ HUSKY: '1' })).toBe(false);
  });

  it('should allow when HUSKY is undefined', () => {
    expect(wouldBypassHusky({ HUSKY: undefined })).toBe(false);
  });

  it('HUSKY=0 bypass is never acceptable — merge commits must also pass all gates', () => {
    // Every commit, including merge commits, must pass pre-commit.
    // The correct workflow for a merge commit is: resolve conflicts,
    // bump the version, then commit via `npm run commit`.
    expect(wouldBypassHusky({ HUSKY: '0' })).toBe(true);
  });
});
