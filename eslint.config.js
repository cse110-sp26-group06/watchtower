import js from '@eslint/js';
import globals from 'globals';
import html from "@html-eslint/eslint-plugin";

// Keep the shared rule set intentionally small and readability-focused.
const jsRules = {
  'no-unused-vars': 'warn',
  'no-console': 'off',
  semi: ['error', 'always'],
  indent: ['error', 2],
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
  'object-curly-spacing': ['error', 'always'],
  'space-before-blocks': ['error', 'always'],
  'keyword-spacing': ['error', { before: true, after: true }],
};

const htmlRules = {
    "@html-eslint/no-duplicate-class": "error",
    "@html-eslint/css-no-empty-blocks" : "error",
    "@html-eslint/max-element-depth" : ["error",{ "max" : 10}],
};

export default [
  {
    // Ignore generated output files.
    ignores: ['eslint-results.sarif'],
  },
  js.configs.recommended,
  {
    files: ["**/*.html"],
      ...html.configs['flat/recommended'],
      rules: {
        ...html.configs['flat/recommended'].rules,
        ...htmlRules
      },
  },
  {
    // Baseline config for all JavaScript files in the repo.
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: jsRules,
    
  },
  {
    // Browser globals for dashboard code and SDK browser fixtures.
    files: ['dashboard/**/*.js', 'sdk/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Cloudflare Worker runtime globals for backend source files.
    files: ['backend/src/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        crypto: 'readonly',
      },
    },
  },
  {
    // Node globals for local tests, Playwright specs, and the ESLint config itself.
    files: ['e2e/**/*.js', 'dashboard/tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Playwright's config file is CommonJS even though the repo otherwise uses ESM.
    files: ['playwright.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: jsRules,
  },
];
