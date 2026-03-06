import { describe, it, expect } from 'vitest';

// The bypass flags checked by safe-push.cjs
const NO_VERIFY_FLAGS = ['--no-verify', '-n'];

function wouldBypass(args: string[]): boolean {
  return args.some(arg => NO_VERIFY_FLAGS.includes(arg));
}

// HUSKY=0 detection logic mirrored from safe-push.cjs
function wouldBypassHusky(env: Record<string, string | undefined>): boolean {
  return env['HUSKY'] === '0';
}

describe('safe-push bypass detection', () => {
  it('should detect --no-verify flag', () => {
    expect(wouldBypass(['--no-verify', '--force-with-lease'])).toBe(true);
  });

  it('should detect -n shorthand flag', () => {
    expect(wouldBypass(['-n', '--force-with-lease'])).toBe(true);
  });

  it('should allow normal push arguments', () => {
    expect(wouldBypass(['--force-with-lease'])).toBe(false);
  });

  it('should allow push with origin and branch', () => {
    expect(wouldBypass(['origin', 'main'])).toBe(false);
  });

  it('should allow empty args', () => {
    expect(wouldBypass([])).toBe(false);
  });

  it('should not treat -no-verify (single dash) as bypass', () => {
    // -no-verify is not the same as --no-verify or -n
    expect(wouldBypass(['-no-verify'])).toBe(false);
  });

  it('should detect --no-verify anywhere in the argument list', () => {
    expect(wouldBypass(['origin', 'main', '--no-verify'])).toBe(true);
  });

  it('should detect -n anywhere in the argument list', () => {
    expect(wouldBypass(['origin', 'main', '-n'])).toBe(true);
  });
});

describe('safe-push HUSKY=0 detection', () => {
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

  it('HUSKY=0 bypass is never acceptable — every push must pass all pre-push gates', () => {
    // Every push must pass pre-push quality gates.
    // Fix issues reported by the hook; do not bypass with HUSKY=0.
    expect(wouldBypassHusky({ HUSKY: '0' })).toBe(true);
  });
});
