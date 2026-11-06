import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatStore } from '../src/store.js';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatComposer } from '../src/beautiful-ui/ChatComposer.js';

test('new session cancels a run, drops approvals and late events, persists empty history', async () => {
  const data = new Map([['euclidraw.copilot.connection.v1', 'unchanged']]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const store = createChatStore(storage);
  let events, finish;
  store.setDraft('old');
  const pending = store.send({ documentId: 'doc' }, async callbacks => {
    events = callbacks;
    callbacks.onProposal({ id: 'old-plan', operations: [] });
    callbacks.onText('old response');
    await new Promise(resolve => { finish = resolve; });
  });
  store.newSession();
  assert.equal(events.signal.aborted, true);
  events.onText('late'); events.onReasoning('late'); events.onProposal({ id: 'late' });
  finish(); await pending;
  assert.deepEqual(store.getSnapshot().timeline, []);
  assert.deepEqual(store.getSnapshot().proposals, []);
  assert.equal(store.getSnapshot().status, 'idle');
  assert.deepEqual(createChatStore(storage).getSnapshot().messages, []);
  assert.equal(data.get('euclidraw.copilot.connection.v1'), 'unchanged');
  store.setDraft('new');
  await store.send({ documentId: 'doc' }, async ({ history, onText }) => { assert.deepEqual(history, []); onText('fresh'); });
  assert.equal(store.getSnapshot().messages.at(-1).text, 'fresh');
});

test('new session action remains accessible while a request is running', () => {
  const html = renderToStaticMarkup(h(ChatComposer, { tab: 'chat', running: true, draft: '' }));
  assert.match(html, /aria-label="새 대화 시작"/);
  assert.match(html, /\+ 새 대화/);
});
