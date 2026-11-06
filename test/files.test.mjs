import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceFiles, validatePath } from '../src/files.js';

function fixture() {
  const data = new Map([['notes.md', 'before']]);
  const files = createWorkspaceFiles({ name: 'workspace', async getFileHandle(name, { create } = {}) {
    if (!data.has(name)) { if (!create) throw new DOMException('missing', 'NotFoundError'); data.set(name, ''); }
    return { async getFile() { return new Blob([data.get(name)]); }, async createWritable() {
      let next; return { async write(text) { next = text; }, async close() { data.set(name, next); }, async abort() {} };
    } };
  } });
  return { files, data };
}
test('paths fail closed', () => {
  for (const path of ['../x', '/etc/passwd', 'a//b', 'a/./b', '.git/config', 'a\\b', 'a/../b']) assert.throws(() => validatePath(path));
  assert.deepEqual(validatePath('docs/notes.md'), ['docs', 'notes.md']);
});
test('file proposals do not write; approval compares revisions and reports weak CAS', async () => {
  const { files, data } = fixture();
  const read = await files.read('notes.md');
  const proposal = files.propose({ path: 'notes.md', text: 'after', expectedRevision: read.revision });
  assert.equal(data.get('notes.md'), 'before');
  const result = await files.apply(proposal);
  assert.equal(data.get('notes.md'), 'after'); assert.equal(result.previousText, 'before');
  assert.equal(result.atomicCompareAndSwap, false);
  await assert.rejects(() => files.apply(proposal));
});
test('external changes and canvas file writes are rejected', async () => {
  const { files, data } = fixture();
  const read = await files.read('notes.md');
  const proposal = files.propose({ path: 'notes.md', text: 'after', expectedRevision: read.revision });
  data.set('notes.md', 'external');
  await assert.rejects(() => files.apply(proposal), /CONFLICT/);
  assert.equal(data.get('notes.md'), 'external');
  assert.throws(() => files.propose({ path: 'open.ecanvas.jsonl', text: '', expectedRevision: null }), /PERMISSION_DENIED/);
});
test('exact patch proposals are revision checked and require a unique match', async () => {
  const { files, data } = fixture();
  const read = await files.read('notes.md');
  const proposal = await files.patch({ path: 'notes.md', expectedRevision: read.revision, search: 'before', replacement: 'after' });
  assert.equal(data.get('notes.md'), 'before');
  await files.apply(proposal); assert.equal(data.get('notes.md'), 'after');
  const next = await files.read('notes.md');
  await assert.rejects(() => files.patch({ path: 'notes.md', expectedRevision: next.revision, search: 'missing', replacement: 'x' }), /exactly once/);
});
