import { describe, expect, it } from 'vitest';

const testSimplifyModule = require('./test-simplify.cjs');

interface CoverageFileData {
  path: string;
  s: Record<string, number>;
  b: Record<string, number[]>;
  f: Record<string, number>;
  statementMap: Record<string, unknown>;
  branchMap: Record<string, unknown>;
  fnMap: Record<string, unknown>;
}

const { extractCoverageFingerprint, findSubsumedTests, removeTestBlock, removeEmptyDescribeBlocks, buildSummary, parseTestNames, fingerprintsEqual, addTestOnly } =
  testSimplifyModule as {
    extractCoverageFingerprint: (coverageData: Record<string, CoverageFileData>) => string[];
    findSubsumedTests: (testCoverageMap: Record<string, string[]>) => string[];
    removeTestBlock: (source: string, testName: string) => string;
    addTestOnly: (source: string, testName: string) => string;
    removeEmptyDescribeBlocks: (source: string) => string;
    buildSummary: (results: {
      removed: string[];
      kept: string[];
      totalBefore: number;
      totalAfter: number;
    }) => string;
    parseTestNames: (source: string) => string[];
    fingerprintsEqual: (fpA: string[], fpB: string[]) => boolean;
  };

// ---------------------------------------------------------------------------
// extractCoverageFingerprint
// ---------------------------------------------------------------------------

describe('extractCoverageFingerprint', () => {
  it('extracts covered statements and ignores uncovered ones', () => {
    const coverage = {
      '/src/math.ts': {
        path: '/src/math.ts',
        s: { '0': 1, '1': 0, '2': 3 },
        b: {},
        f: {},
        statementMap: {},
        branchMap: {},
        fnMap: {},
      },
    };
    const fp = extractCoverageFingerprint(coverage);
    expect(fp).toContain('s:/src/math.ts:0');
    expect(fp).toContain('s:/src/math.ts:2');
    expect(fp).not.toContain('s:/src/math.ts:1');
  });
});

// ---------------------------------------------------------------------------
// findSubsumedTests
// ---------------------------------------------------------------------------

describe('findSubsumedTests', () => {
  it('detects multiple subsumed tests', () => {
    const map = {
      'covers all': ['s:file:0', 's:file:1', 's:file:2', 's:file:3'],
      'covers first two': ['s:file:0', 's:file:1'],
      'covers last two': ['s:file:2', 's:file:3'],
    };
    const subsumed = findSubsumedTests(map);
    expect(subsumed).toContain('covers first two');
    expect(subsumed).toContain('covers last two');
    expect(subsumed).not.toContain('covers all');
  });

  it('returns empty array for a single test', () => {
    expect(findSubsumedTests({ 'only test': ['s:file:0'] })).toEqual([]);
  });

  it('keeps both when neither test is a subset of the other', () => {
    const map = {
      'test X': ['s:file:0', 's:file:1'],
      'test Y': ['s:file:1', 's:file:2'],
    };
    expect(findSubsumedTests(map)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// removeTestBlock
// ---------------------------------------------------------------------------

describe('removeTestBlock', () => {
  it('handles division operators without confusing them for regex', () => {
    const source = [
      "it('has division', () => {",
      '  const x = 10 / 2;',
      '  expect(x).toBe(5);',
      '});',
      '',
      "it('keeper', () => { expect(1).toBe(1); });",
    ].join('\n');

    const result = removeTestBlock(source, 'has division');
    expect(result).not.toContain('has division');
    expect(result).toContain('keeper');
  });
});

// ---------------------------------------------------------------------------
// removeEmptyDescribeBlocks
// ---------------------------------------------------------------------------

describe('removeEmptyDescribeBlocks', () => {
  it('removes describe with only lifecycle hooks (no tests)', () => {
    const source = [
      "describe('hooks only', () => {",
      '  beforeEach(() => {',
      "    console.log('setup');",
      '  });',
      '  afterEach(() => {',
      "    console.log('teardown');",
      '  });',
      '});',
    ].join('\n');
    expect(removeEmptyDescribeBlocks(source).trim()).toBe('');
  });

  it('preserves describe with test.skip calls', () => {
    const source = [
      "describe('has skipped test', () => {",
      "  it.skip('skipped', () => {",
      '    expect(true).toBe(true);',
      '  });',
      '});',
    ].join('\n');
    expect(removeEmptyDescribeBlocks(source)).toBe(source);
  });

  it('removes inner empty describe but keeps outer with tests', () => {
    const source = [
      "describe('outer', () => {",
      "  describe('empty inner', () => {",
      '  });',
      "  it('test', () => { expect(1).toBe(1); });",
      '});',
    ].join('\n');

    const result = removeEmptyDescribeBlocks(source);
    expect(result).not.toContain('empty inner');
    expect(result).toContain('test');
  });
});

// ---------------------------------------------------------------------------
// buildSummary
// ---------------------------------------------------------------------------

describe('buildSummary', () => {
  it('reports no changes when nothing was removed', () => {
    const summary = buildSummary({
      removed: [],
      kept: ['test A', 'test B'],
      totalBefore: 2,
      totalAfter: 2,
    });
    expect(summary).toContain('No redundant tests found');
  });
});

// ---------------------------------------------------------------------------
// parseTestNames
// ---------------------------------------------------------------------------

describe('parseTestNames', () => {
  it('extracts names from it() and test() calls', () => {
    const source = [
      "it('first test', () => { expect(1).toBe(1); });",
      "test('second test', () => { expect(2).toBe(2); });",
    ].join('\n');
    expect(parseTestNames(source)).toEqual(['first test', 'second test']);
  });

  it('handles .skip and .only modifiers', () => {
    const source = [
      "it.skip('skipped', () => {});",
      "test.only('focused', () => {});",
    ].join('\n');
    expect(parseTestNames(source)).toEqual(['skipped', 'focused']);
  });
});

// ---------------------------------------------------------------------------
// fingerprintsEqual
// ---------------------------------------------------------------------------

describe('fingerprintsEqual', () => {
  it('returns true for identical sorted arrays', () => {
    expect(fingerprintsEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
  });

  it('returns false for different lengths', () => {
    expect(fingerprintsEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });

  it('returns false when elements differ', () => {
    expect(fingerprintsEqual(['a', 'b'], ['a', 'x'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addTestOnly
// ---------------------------------------------------------------------------

describe('addTestOnly', () => {
  it('transforms test() to test.only()', () => {
    const source = "test('my test', () => {});";
    const result = addTestOnly(source, 'my test');
    expect(result).toContain("test.only('my test'");
  });

  it('transforms it.skip() to it.only()', () => {
    const source = "it.skip('paused', () => {});";
    const result = addTestOnly(source, 'paused');
    expect(result).toContain("it.only('paused'");
    expect(result).not.toContain('.skip');
  });

  it('returns source unchanged when test name not found', () => {
    const source = "it('exists', () => {});";
    const result = addTestOnly(source, 'nonexistent');
    expect(result).toBe(source);
  });

  it('only adds .only to the matching test', () => {
    const source = [
      "it('first', () => {});",
      "it('second', () => {});",
      "it('third', () => {});",
    ].join('\n');
    const result = addTestOnly(source, 'second');
    expect(result).toContain("it.only('second'");
    expect(result).not.toContain("it.only('first'");
    expect(result).not.toContain("it.only('third'");
  });
});
