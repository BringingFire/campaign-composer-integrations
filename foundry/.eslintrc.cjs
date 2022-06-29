module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-inferrable-types': [
      'warn',
      {
        ignoreProperties: true,
        ignoreParameters: true,
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
