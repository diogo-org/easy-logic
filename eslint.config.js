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
