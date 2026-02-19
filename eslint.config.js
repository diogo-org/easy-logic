import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// High-quality ESLint configuration for TypeScript projects
// Enforces strict rules to maintain code quality for AI-assisted development
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'coverage/**', 'report/**', 'node_modules/**', '*.config.js', '*.config.ts'],
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
    },
  }
);
