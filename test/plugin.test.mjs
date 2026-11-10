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
  assert.equal(contribution.panels[0].icon.size, 20);
  assert.equal(contribution.panels[0].icon.paths.length, 3);
  result.dispose(); assert.ok(removed);
});

test('an older host without optional services still mounts the chat panel', () => {
  let contribution, mounted;
  const result = plugin.activate({ services: { get(name) {
    if (name === 'ui.react-panels') return { mount(_host, spec) { mounted = spec; } };
    if (name === 'ui.workbench') return { register(_owner, ui) { contribution = ui; return () => {}; } };
    throw new Error(`[PhantomDependency] unknown host service ${name}`);
  } } });
  contribution.panels[0].mount({}, {});
  assert.equal(mounted.props.snapshot, undefined);
  assert.equal(mounted.props.changes, undefined);
  assert.equal(mounted.props.tools, undefined);
  result.dispose();
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
test('proposals require explicit approval and are not replayed', async () => {
  const store = createChatStore(null);
  store.setDraft('change');
  await store.send({}, async ({ onProposal }) => onProposal({ id: 'one', operations: [] }));
  let commits = 0;
  const changes = { apply(change) { commits++; return { id: change.id }; } };
  assert.equal(commits, 0);
  store.apply('one', changes); store.apply('one', changes);
  assert.equal(commits, 1);
  assert.equal(store.getSnapshot().proposals[0].status, 'applied');
});
test('history is bounded and isolated by document identity', async () => {
  const store = createChatStore(null);
  store.setDraft('first'); await store.send({ documentId: 'a' }, async ({ onText }) => onText('answer'));
  store.setDraft('follow-up'); await store.send({ documentId: 'a' }, async ({ history }) => {
    assert.deepEqual(history, [{ role: 'user', text: 'first' }, { role: 'assistant', text: 'answer' }]);
  });
  store.setDraft('different document'); await store.send({ documentId: 'b' }, async ({ history }) => assert.deepEqual(history, []));
});
test('document revocation cancels an in-flight run and ignores late proposals', async () => {
  const store = createChatStore(null), lifetime = new AbortController();
  store.setDraft('work');
  await store.send({ documentId: 'a' }, async ({ signal, onText, onProposal }) => {
    lifetime.abort(); assert.equal(signal.aborted, true);
    onText('late'); onProposal({ id: 'late', documentId: 'a' });
  }, lifetime.signal);
  assert.equal(store.getSnapshot().status, 'cancelled');
  assert.equal(store.getSnapshot().proposals.length, 0);
  assert.equal(store.getSnapshot().messages.at(-1).text, '');
});
