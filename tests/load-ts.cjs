const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const storage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
const mocks = new Map();
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === '@react-native-async-storage/async-storage') return storage;
  if (mocks.has(name)) return mocks.get(name);
  return originalLoad.call(this, name, parent, isMain);
};
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
require.extensions['.png'] = (module, filename) => { module.exports = filename; };
require.extensions['.tsx'] = require.extensions['.ts'];
module.exports = { storage, mocks };
