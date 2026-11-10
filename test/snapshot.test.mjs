import test from 'node:test';
import assert from 'node:assert/strict';
import { toolContent } from '../src/tool-content.js';

test('snapshot tool results keep metadata in text and attach at most two images', () => {
  const result = { source: 'canvas-pixels', scope: 'both', skipped: [], snapshots: [] };
  const content = toolContent(result, [
    { scope: 'selection', mimeType: 'image/png', data: 'c2VsZWN0aW9u' },
    { scope: 'viewport', mimeType: 'image/png', data: 'dmlld3BvcnQ=' },
    { scope: 'extra', mimeType: 'image/png', data: 'ZXh0cmE=' },
  ]);
  assert.equal(content.length, 3);
  assert.equal(content[0].type, 'text');
  assert.deepEqual(JSON.parse(content[0].text), result);
  assert.deepEqual(content.slice(1).map(image => image.mimeType), ['image/png', 'image/png']);
  assert.deepEqual(content.slice(1).map(image => image.data), ['c2VsZWN0aW9u', 'dmlld3BvcnQ=']);
});

test('ordinary tool results and malformed images stay text only', () => {
  assert.deepEqual(toolContent({ selectedIds: ['a'] }), [{ type: 'text', text: '{"selectedIds":["a"]}' }]);
  assert.equal(toolContent({ ok: true }, [{ mimeType: 'image/png' }, null, { data: 42 }]).length, 1);
});
