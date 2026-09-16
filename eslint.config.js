import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Lean, fast lint pass. Type-aware rules are deliberately left off: `npm run
 * typecheck` already runs the compiler over both workspaces with strict mode,
 * so duplicating it here would only make linting slow.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'server/src/db/migrations/**',
      'client/public/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'properties'],
    },
  },

  // Server, scripts and shared contracts: Node globals, no DOM.
  {
    files: ['server/**/*.ts', 'scripts/**/*.ts', 'shared/**/*.ts', '*.js', '*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Client: browser globals plus the React hook rules.
  {
    files: ['client/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // The scripts are CLI entry points, so writing to stdout is the point.
  {
    files: ['scripts/**/*.ts', 'server/src/db/migrate.ts', 'server/build.mjs'],
    rules: { 'no-console': 'off' },
  },
);
