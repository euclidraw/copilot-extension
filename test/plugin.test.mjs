import test from 'node:test';
import assert from 'node:assert/strict';
import plugin from '../dist/plugin.js';
import { createChatStore } from '../src/store.js';

test('activation contributes a left panel without canonical aspects or writes', () => {
  let contribution, removed = false;
  const result = plugin.activate({ services: { get(name) {
    if (name === 'ui.react-panels') return { mount() {} };
    if (name === 'ui.workbench') return { register(owner, ui) { assert.equal(owner, 'euclidraw.copilot'); contribution = ui; return () => { removed = true; }; } };
    throw new Error(`Unexpected service ${name}`);
  } } });
  assert.deepEqual(plugin.aspects, []);
  assert.equal(contribution.panels[0].defaultZone, 'left');
  result.dispose(); assert.ok(removed);
});
test('streaming freezes context and cancellation rejects late text', async () => {
  const store = createChatStore(null);
  store.setDraft('요약');
  const context = { selectedIds: ['a'] };
  let finish;
  const pending = store.send(context, async request => {
    context.selectedIds.push('b');
    assert.deepEqual(request.context.selectedIds, ['a']);
    request.onText('first'); store.cancel(); request.onText('late');
    await new Promise(resolve => { finish = resolve; });
  });
  finish(); await pending;
  assert.equal(store.getSnapshot().status, 'cancelled');
  assert.equal(store.getSnapshot().messages.at(-1).text, 'first');
});
test('missing provider never pretends a request was sent; storage failure is tolerated', async () => {
  const store = createChatStore({ getItem() { throw Error(); }, setItem() { throw Error(); } });
  store.setDraft('hello'); await store.send({}, undefined);
  assert.equal(store.getSnapshot().messages.length, 0);
  assert.ok(store.getSnapshot().error);
});
