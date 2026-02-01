import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import i18next from 'eslint-plugin-i18next';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'coverage/**', 'report/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      i18next,
    },
    rules: {
      // Prohibit magic numbers - must use named constants
      'no-magic-numbers': ['error', {
        ignore: [-1, 0, 1, 2], // Common indices and counts
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
      }],
      
      // Prohibit hardcoded strings in JSX - must use i18n
      'i18next/no-literal-string': ['error', {
        mode: 'jsx-text-only',
        'jsx-attributes': {
          include: ['title', 'aria-label', 'placeholder', 'alt'],
        },
        'jsx-components': {
          exclude: ['Trans'],
        },
        words: {
          // Exclude patterns that are not user-visible text
          exclude: [
            // Single letters
            '[A-Z]',
            '[TF]',
            // Single punctuation marks (universally understood)
            '^[.:;,!?]$',
            // Symbols and emojis (allow any string with emojis)
            '.*[🎉🎊🌟⭐✨💫🎆🎇🏆👏🙌💯🔥💪].*',
          ],
        },
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
      'i18next/no-literal-string': 'off',
    },
  }
);
