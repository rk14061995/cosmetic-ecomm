const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTsModule(tsPath) {
  const source = fs.readFileSync(tsPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  const sandbox = { module, exports: module.exports, require };
  vm.runInNewContext(outputText, sandbox, { filename: tsPath });
  return module.exports;
}

const states = loadTsModule(path.join(__dirname, '..', 'data', 'indianStates.ts')).INDIAN_STATES_AND_UTS;

test('indian states list contains key values used in checkout', () => {
  assert.ok(Array.isArray(states));
  assert.ok(states.includes('Maharashtra'));
  assert.ok(states.includes('Karnataka'));
  assert.ok(states.includes('Delhi'));
});

test('indian states list has no duplicates', () => {
  const uniq = new Set(states);
  assert.equal(uniq.size, states.length);
});
