const fs = require('fs');
const c = fs.readFileSync('eslint.config.mjs', 'utf8');
const n = c
  .replace('"@typescript-eslint/no-unused-vars": "off"', '"@typescript-eslint/no-unused-vars": "error"')
  .replace('"no-unused-vars": "off"', '"no-unused-vars": "error"');
fs.writeFileSync('eslint.config.mjs', n);
console.log('Enabled unused-vars rules');