const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

test('patched uuid preserves the CommonJS v4 API used by xcode and ngrok', () => {
  for (const name of ['xcode', '@expo/ngrok']) {
    const requireFromPackage = createRequire(require.resolve(name));
    const uuid = requireFromPackage('uuid');
    assert.equal(requireFromPackage('uuid/package.json').version, '11.1.1');
    assert.match(uuid.v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.throws(() => uuid.v3('input', uuid.v3.DNS, new Uint8Array(1)));
  }
});
test('xcode still generates native project IDs using the patched uuid', () => {
  const xcode = require('xcode');
  const project = xcode.project('/tmp/unwritten-test-project.pbxproj');
  project.hash = { project: { objects: {} } };
  const id = project.generateUuid();
  assert.match(id, /^[A-F0-9]{24}$/);
});
