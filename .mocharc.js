module.exports = {
  'node-option': ['import=tsx'],
  require: ['./.mocha-setup.cjs'],
  spec: ['test/*.ts', 'test/*.tsx'],
  timeout: 10000,
};
