import { describe, expect, it } from 'vitest';

const vitestOutputModule = require('./vitest-output.cjs');

const { parseVitestRunOutput } = vitestOutputModule as {
  parseVitestRunOutput: (output: string) => {
    coverage: number;
    skippedTests: number;
    failedTests: number;
    passedTests: number;
  };
};

describe('vitest-output.cjs', () => {
  it('extracts coverage and skipped tests when both are present', () => {
    const output = [
      ' RUN  v3.2.4 C:/repo',
      '      Tests  5 passed | 2 skipped (7)',
      'All files |   87.50 |   80.00 |   90.00 |   87.50 |',
    ].join('\n');

    const result = parseVitestRunOutput(output);

    expect(result.coverage).toBe(87.5);
    expect(result.skippedTests).toBe(2);
  });

  it('returns zero skipped tests when skip summary is absent', () => {
    const output = [
      ' RUN  v3.2.4 C:/repo',
      '      Tests  4 passed (4)',
      'All files |   95.00 |   90.00 |   90.00 |   95.00 |',
    ].join('\n');

    const result = parseVitestRunOutput(output);

    expect(result.coverage).toBe(95);
    expect(result.skippedTests).toBe(0);
  });

  it('returns zero coverage when coverage line is absent', () => {
    const output = [
      ' RUN  v3.2.4 C:/repo',
      '      Tests  1 passed | 1 skipped (2)',
    ].join('\n');

    const result = parseVitestRunOutput(output);

    expect(result.coverage).toBe(0);
    expect(result.skippedTests).toBe(1);
  });

  it('extracts failed test count', () => {
    const output = [
      ' RUN  v3.2.4 C:/repo',
      '      Tests  3 passed | 2 failed (5)',
    ].join('\n');

    const result = parseVitestRunOutput(output);

    expect(result.failedTests).toBe(2);
    expect(result.passedTests).toBe(3);
  });

  it('returns zero failed tests when no failures are present', () => {
    const output = [
      ' RUN  v3.2.4 C:/repo',
      '      Tests  10 passed (10)',
    ].join('\n');

    const result = parseVitestRunOutput(output);

    expect(result.failedTests).toBe(0);
    expect(result.passedTests).toBe(10);
  });

  it('extracts all fields together when output contains failures, skips, and coverage', () => {
    const output = [
      ' RUN  v3.2.4 C:/repo',
      '      Tests  8 passed | 1 failed | 2 skipped (11)',
      'All files |   82.00 |   75.00 |   80.00 |   82.00 |',
    ].join('\n');

    const result = parseVitestRunOutput(output);

    expect(result.passedTests).toBe(8);
    expect(result.failedTests).toBe(1);
    expect(result.skippedTests).toBe(2);
    expect(result.coverage).toBe(82);
  });

  it('returns zero for all counts when output is empty', () => {
    const result = parseVitestRunOutput('');

    expect(result.coverage).toBe(0);
    expect(result.failedTests).toBe(0);
    expect(result.passedTests).toBe(0);
    expect(result.skippedTests).toBe(0);
  });
});
