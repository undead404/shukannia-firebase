module.exports = {
  env: {
    commonjs: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:promise/recommended',
    'plugin:array-func/all',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'plugin:lodash/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:prettier/recommended',
    'plugin:jest/all',
    'prettier',
  ],
  overrides: [
    {
      files: ['./*'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: true,
          },
        ],
        'node/no-extraneous-import': 'off',
        'node/no-unpublished-import': 'off',
      },
    },
    {
      env: {
        'jest/globals': true,
      },
      files: ['**/*.test.ts'],
      rules: {
        'lodash/prefer-constant': 'off',
        'no-magic-numbers': 'off',
      },
    },
    {
      files: ['**/__mocks__/**'],
      rules: {
        'import/prefer-default-export': 'off',
        'no-magic-numbers': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    'prettier',
    'promise',
    'unicorn',
    'array-func',
    'lodash',
    'node',
    'eslint-comments',
    'jest',
    '@typescript-eslint',
  ],
  root: true,
  rules: {
    'no-param-reassign': ['error', { props: false }],
    // 'consistent-return': 'off',
    // 'arrow-body-style': 0,
    // 'comma-dangle': 0,
    'node/no-unsupported-features/es-syntax': 'off',
    // 'import/prefer-await-to-then': 'off',
    // 'no-underscore-dangle': 'off',
    'lodash/prefer-lodash-method': [
      'error',
      {
        ignoreMethods: ['find'],
      },
    ],
    'node/no-missing-import': 'off',
    'node/no-unpublished-import': 'off',
    'unicorn/no-null': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-process-exit': 'off',
    'unicorn/no-process-exit': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    'functional/no-conditional-statement': 'off',
    'functional/no-try-statement': 'off',
    'functional/no-throw-statement': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
      },
    ],
    'no-void': ['error', { allowAsStatement: true }],
    'no-magic-numbers': [
      'error',
      {
        ignore: [0, 1, -1],
        ignoreDefaultValues: true,
      },
    ],
    'no-console': 'error',
    'jest/prefer-expect-assertions': 'off',
    'jest/no-conditional-expect': 'off',
    'jest/expect-expect': 'off',
    'jest/prefer-strict-equal': 'off',
    'unicorn/prefer-spread': 'off',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`,
        project: '.',
      },
    },
  },
};
