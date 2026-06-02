import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Auto-removable dead imports are an error (eslint --fix strips them).
      'unused-imports/no-unused-imports': 'error',
      // Defer unused-var detection to the plugin so it composes with the
      // auto-import-removal above.
      '@typescript-eslint/no-unused-vars': 'off',
      // `any` is tracked as a warning during the typed-migration; CI gates on
      // errors so genuine problems block while the `any` backlog is burned down.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused locals/args are tracked as warnings (dead *imports* are still a
      // hard error and auto-stripped above); `_`-prefixed are intentional.
      'unused-imports/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Allow the idiomatic `cond ? a() : b()` / `cond && a()` statement form.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      // Hook dependency completeness is advisory, not blocking.
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
