import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig } from 'eslint/config';

// Node.js globals for CJS script files
const nodeGlobals = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  __dirname: 'readonly',
  __filename: 'readonly',
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  URL: 'readonly',
};

// High-quality ESLint configuration for TypeScript projects
// Enforces strict rules to maintain code quality for AI-assisted development
// SonarJS rules mirror SonarLint/SonarQube checks so violations are caught in CI
export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    ignores: ['dist/**', 'coverage/**', 'report/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },
  // CJS Node.js scripts: provide node globals, relax TS-specific rules
  {
    files: ['scripts/**/*.cjs', '.husky/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-magic-numbers': 'off',
      // PATH-based commands are expected and safe in local dev scripts
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/os-command': 'warn',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // Prohibit magic numbers - must use named constants
      'no-magic-numbers': ['error', {
        ignore: [-1, 0, 1, 2], // Common indices and counts
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
      }],
      // Enforce consistent, readable code patterns
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'no-else-return': 'error',
      'no-unneeded-ternary': 'error',
      'object-shorthand': 'error',
      'curly': ['error', 'all'],
      'no-lonely-if': 'error',
      'no-negated-condition': 'error',
      'no-useless-return': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-implicit-coercion': 'error',
      'no-useless-concat': 'error',
      'no-useless-call': 'error',
      'no-throw-literal': 'error',
      
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Relaxed rules for test files
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test.setup.ts'],
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Test files for CJS modules legitimately use require()
      '@typescript-eslint/no-require-imports': 'off',
      // Test files testing git/shell commands trigger these path-safety rules intentionally
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/os-command': 'off',
    },
  }
);
