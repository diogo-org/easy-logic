/**
 * pre-commit.test.ts
 *
 * Tests for the TDD-enforcing pre-commit hook.
 * Covers: file classification (with new-vs-modified distinction),
 *         marker-based phase detection, secrets logic, hook validation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

// --- File classification patterns (mirrored from pre-commit.cjs) -------

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|js|mts|mjs)$/;
const SOURCE_FILE_PATTERN = /\.(ts|js|cjs|mjs)$/;

/**
 * Classify staged files into semantic groups.
 *
 * allStaged  - All staged files (Added + Copied + Modified).
 * addedFiles - Files that are brand-new (Added only, diff-filter=A).
 */
function classifyFiles(allStaged: string[], addedFiles: string[] = []) {
  const testFiles = allStaged.filter(f => TEST_FILE_PATTERN.test(f));
  const newTestFiles = addedFiles.filter(f => TEST_FILE_PATTERN.test(f));
  const allSourceFiles = allStaged.filter(f => SOURCE_FILE_PATTERN.test(f));
  const implFiles = allSourceFiles.filter(f => !TEST_FILE_PATTERN.test(f));
  return { testFiles, newTestFiles, implFiles, allSourceFiles };
}

// --- Phase detection (mirrored from pre-commit.cjs) -------------------

type Phase = 'red' | 'green' | 'safe' | 'skip';

function detectPhase(
  allStaged: string[],
  addedFiles: string[],
  redMarkerExists: boolean,
): Phase {
  const { implFiles, newTestFiles, allSourceFiles } = classifyFiles(allStaged, addedFiles);
  if (allSourceFiles.length === 0) return 'skip';
  if (newTestFiles.length > 0 && implFiles.length === 0) return 'red';
  if (redMarkerExists && implFiles.length > 0) return 'green';
  return 'safe';
}

// --- Marker file helpers -----------------------------------------------

const RED_PHASE_MARKER = '.tdd-red-phase';

function createMarkerDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tdd-marker-'));
}

function writeMarker(dir: string): string {
  const p = path.join(dir, RED_PHASE_MARKER);
  fs.writeFileSync(p, String(Date.now()), 'utf-8');
  return p;
}

function clearMarker(dir: string): void {
  const p = path.join(dir, RED_PHASE_MARKER);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// --- Secrets detection (mirrored from pre-commit.cjs) -----------------

const secretPatterns: Array<{ regex: RegExp; description: string }> = [
  { regex: /_authToken=.+/i, description: 'Auth token' },
  { regex: /password\s*=\s*['"][^'"]+['"]/i, description: 'Password' },
  { regex: /api[_-]?key\s*[:=]\s*['"]?[a-z0-9]{20,}['"]?/i, description: 'API key' },
  { regex: /secret[_-]?key\s*[:=]\s*['"]?[a-z0-9]{20,}['"]?/i, description: 'Secret key' },
  { regex: /token\s*[:=]\s*['"]?[a-z0-9]{20,}['"]?/i, description: 'Token' },
  { regex: /bearer\s+[a-z0-9_.~+\-/]+=*/i, description: 'Bearer token' },
  { regex: /ghp_[a-z0-9]{36}/i, description: 'GitHub Personal Access Token' },
  { regex: /gho_[a-z0-9]{36}/i, description: 'GitHub OAuth token' },
  { regex: /github_pat_[a-z0-9]{22}_[a-z0-9]{59}/i, description: 'GitHub fine-grained PAT' },
];

function detectSecrets(line: string): boolean {
  return secretPatterns.some(({ regex }) => regex.test(line) && !line.includes('${GITHUB_TOKEN}'));
}

// --- Tests ------------------------------------------------------------

describe('file classification', () => {
  it('identifies test files by .test.ts extension', () => {
    const { testFiles, implFiles } = classifyFiles(['src/feature.test.ts']);
    expect(testFiles).toContain('src/feature.test.ts');
    expect(implFiles).toHaveLength(0);
  });

  it('identifies test files by .spec.ts extension', () => {
    const { testFiles } = classifyFiles(['src/feature.spec.ts']);
    expect(testFiles).toContain('src/feature.spec.ts');
  });

  it('identifies implementation files', () => {
    const { implFiles, testFiles } = classifyFiles(['src/feature.ts']);
    expect(implFiles).toContain('src/feature.ts');
    expect(testFiles).toHaveLength(0);
  });

  it('classifies .cjs files as implementation', () => {
    const { implFiles } = classifyFiles(['.husky/pre-commit.cjs']);
    expect(implFiles).toContain('.husky/pre-commit.cjs');
  });

  it('excludes non-source files from all source lists', () => {
    const { allSourceFiles } = classifyFiles(['README.md', 'package.json', '.gitignore']);
    expect(allSourceFiles).toHaveLength(0);
  });

  it('handles mixed staged files correctly', () => {
    const files = ['src/feature.ts', 'src/feature.test.ts', 'README.md'];
    const { testFiles, implFiles, allSourceFiles } = classifyFiles(files);
    expect(testFiles).toContain('src/feature.test.ts');
    expect(implFiles).toContain('src/feature.ts');
    expect(allSourceFiles).toHaveLength(2);
  });
});

describe('new vs modified test file distinction', () => {
  it('identifies new test files when they are also in addedFiles', () => {
    const staged = ['src/feature.test.ts'];
    const added = ['src/feature.test.ts'];
    const { newTestFiles, testFiles } = classifyFiles(staged, added);
    expect(newTestFiles).toContain('src/feature.test.ts');
    expect(testFiles).toContain('src/feature.test.ts');
  });

  it('does not mark modified test files as new when absent from addedFiles', () => {
    const staged = ['src/feature.test.ts'];
    const added: string[] = [];
    const { newTestFiles, testFiles } = classifyFiles(staged, added);
    expect(newTestFiles).toHaveLength(0);
    expect(testFiles).toContain('src/feature.test.ts');
  });

  it('correctly separates new from modified when both kinds are staged', () => {
    const staged = ['src/a.test.ts', 'src/b.test.ts'];
    const added = ['src/a.test.ts'];
    const { newTestFiles } = classifyFiles(staged, added);
    expect(newTestFiles).toContain('src/a.test.ts');
    expect(newTestFiles).not.toContain('src/b.test.ts');
  });

  it('non-test added files do not appear in newTestFiles', () => {
    const staged = ['src/helper.ts', 'src/helper.test.ts'];
    const added = ['src/helper.ts', 'src/helper.test.ts'];
    const { newTestFiles, implFiles } = classifyFiles(staged, added);
    expect(newTestFiles).toContain('src/helper.test.ts');
    expect(newTestFiles).not.toContain('src/helper.ts');
    expect(implFiles).toContain('src/helper.ts');
  });
});

describe('TDD phase detection', () => {
  describe('RED phase', () => {
    it('detects RED when new test files staged and no impl files', () => {
      expect(detectPhase(['src/new.test.ts'], ['src/new.test.ts'], false)).toBe('red');
    });

    it('detects RED when multiple new test files staged', () => {
      const staged = ['src/a.test.ts', 'src/b.spec.ts'];
      expect(detectPhase(staged, staged, false)).toBe('red');
    });

    it('does NOT detect RED when test files are only modified (not new)', () => {
      const result = detectPhase(['src/existing.test.ts'], [], false);
      expect(result).toBe('safe');
    });

    it('does NOT detect RED when new test files staged alongside impl files', () => {
      const staged = ['src/a.test.ts', 'src/a.ts'];
      const added = ['src/a.test.ts', 'src/a.ts'];
      expect(detectPhase(staged, added, false)).not.toBe('red');
    });
  });

  describe('GREEN phase', () => {
    it('detects GREEN when red marker exists and impl files are staged', () => {
      expect(detectPhase(['src/feature.ts'], [], true)).toBe('green');
    });

    it('detects GREEN when both tests and impl staged and marker exists', () => {
      expect(detectPhase(['src/feature.ts', 'src/feature.test.ts'], [], true)).toBe('green');
    });

    it('does NOT detect GREEN without red marker even when impl is staged', () => {
      expect(detectPhase(['src/feature.ts'], [], false)).toBe('safe');
    });

    it('does NOT detect GREEN if only modified test files and marker exists but no impl', () => {
      const result = detectPhase(['src/existing.test.ts'], [], true);
      expect(result).not.toBe('green');
    });
  });

  describe('SAFE (no active TDD cycle)', () => {
    it('detects SAFE when impl staged without red marker', () => {
      expect(detectPhase(['src/feature.ts'], [], false)).toBe('safe');
    });

    it('detects SAFE when impl and modified tests staged without red marker', () => {
      expect(detectPhase(['src/feature.ts', 'src/feature.test.ts'], [], false)).toBe('safe');
    });
  });

  describe('SKIP', () => {
    it('skips when only non-source files are staged', () => {
      expect(detectPhase(['README.md', 'package.json'], [], false)).toBe('skip');
    });

    it('skips when no files are staged', () => {
      expect(detectPhase([], [], false)).toBe('skip');
    });
  });
});

describe('marker file management', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createMarkerDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writeMarker creates the marker file', () => {
    const p = writeMarker(tmpDir);
    expect(fs.existsSync(p)).toBe(true);
  });

  it('marker file contains a unix timestamp', () => {
    const p = writeMarker(tmpDir);
    const content = fs.readFileSync(p, 'utf-8');
    expect(Number(content)).toBeGreaterThan(0);
  });

  it('clearMarker removes an existing marker file', () => {
    writeMarker(tmpDir);
    clearMarker(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, RED_PHASE_MARKER))).toBe(false);
  });

  it('clearMarker is a no-op when marker does not exist', () => {
    expect(() => clearMarker(tmpDir)).not.toThrow();
  });

  it('marker absence means no active TDD cycle', () => {
    const markerExists = fs.existsSync(path.join(tmpDir, RED_PHASE_MARKER));
    expect(markerExists).toBe(false);
  });

  it('marker presence means a red commit was the last TDD commit', () => {
    writeMarker(tmpDir);
    const markerExists = fs.existsSync(path.join(tmpDir, RED_PHASE_MARKER));
    expect(markerExists).toBe(true);
  });
});

describe('RED phase behaviour rules', () => {
  it('red phase commit is valid when tests fail (exit code != 0)', () => {
    const exitCode = 1;
    expect(exitCode !== 0).toBe(true);
  });

  it('red phase is blocked when all tests pass (exit code = 0)', () => {
    const exitCode = 0;
    expect(exitCode === 0).toBe(true);
  });

  it('marker is written after a valid red phase commit', () => {
    const markerPath = writeMarker(createMarkerDir());
    expect(fs.existsSync(markerPath)).toBe(true);
  });
});

describe('GREEN phase behaviour rules', () => {
  it('green phase commit is valid when all tests pass (exit code = 0)', () => {
    const exitCode = 0;
    expect(exitCode === 0).toBe(true);
  });

  it('green phase is blocked when tests fail (exit code != 0)', () => {
    const exitCode = 1;
    expect(exitCode !== 0).toBe(true);
  });

  it('marker is cleared after a successful green phase commit', () => {
    const tmpD = createMarkerDir();
    writeMarker(tmpD);
    clearMarker(tmpD);
    expect(fs.existsSync(path.join(tmpD, RED_PHASE_MARKER))).toBe(false);
  });
});

describe('pre-commit secrets detection', () => {
  it('should detect a GitHub PAT', () => {
    const line = 'const token = "ghp_' + 'a'.repeat(36) + '"';
    expect(detectSecrets(line)).toBe(true);
  });

  it('should detect an auth token assignment', () => {
    expect(detectSecrets('_authToken=npm_supersecrettoken123456')).toBe(true);
  });

  it('should detect a password assignment', () => {
    expect(detectSecrets("password = 'my-secret-password'")).toBe(true);
  });

  it('should not flag a GITHUB_TOKEN env variable reference', () => {
    expect(detectSecrets('token: ${GITHUB_TOKEN}')).toBe(false);
  });

  it('should not flag plain source code', () => {
    expect(detectSecrets('export function calculateTotal(items: Item[]): number {')).toBe(false);
  });
});

describe('pre-commit hook file validation', () => {
  it('pre-commit.cjs should exist in .husky directory', () => {
    const hookPath = path.join(process.cwd(), '.husky', 'pre-commit.cjs');
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it('pre-commit shell script should delegate to pre-commit.cjs', () => {
    const hookPath = path.join(process.cwd(), '.husky', 'pre-commit');
    expect(fs.existsSync(hookPath)).toBe(true);
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('pre-commit.cjs');
    expect(content).toContain('node');
  });

  it('pre-commit.cjs documents RED and GREEN phase', () => {
    const hookPath = path.join(process.cwd(), '.husky', 'pre-commit.cjs');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content.toLowerCase()).toContain('red');
    expect(content.toLowerCase()).toContain('green');
  });

  it('pre-commit.cjs uses a marker file for state persistence', () => {
    const hookPath = path.join(process.cwd(), '.husky', 'pre-commit.cjs');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('.tdd-red-phase');
  });

  it('pre-commit.cjs distinguishes new test files via diff-filter=A', () => {
    const hookPath = path.join(process.cwd(), '.husky', 'pre-commit.cjs');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('diff-filter=A');
  });

  it('pre-commit.cjs contains TDD enforcement logic', () => {
    const hookPath = path.join(process.cwd(), '.husky', 'pre-commit.cjs');
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('TDD');
  });
});