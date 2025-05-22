import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: globals.browser,
    },
    ...pluginJs.configs.recommended, // Spread the recommended config

    // Add your rules here:
    rules: {
      quotes: ['error', 'single', { allowTemplateLiterals: true }], // Enforce single quotes
      semi: ['error', 'always'], // Enforce semicolons
      // ... other rules as needed
    },
  },
];
