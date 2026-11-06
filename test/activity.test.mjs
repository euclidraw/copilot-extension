import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RunActivity, ReasoningSection, activityLabel } from '../src/beautiful-ui/RunActivity.js';
import { createChatStore } from '../src/store.js';

test('pending requests immediately show honest waiting feedback without fabricated reasoning', () => {
  const html = renderToStaticMarkup(h(RunActivity, { state: { status: 'running', phase: 'waiting', startedAt: Date.now() } }));
  assert.match(html, /모델 응답 대기 중/);
  assert.match(html, /role="status"/);
  assert.match(html, /경과 시간/);
  assert.doesNotMatch(html, /모델 추론 수신 중/);
  assert.equal(renderToStaticMarkup(h(RunActivity, { state: { status: 'idle' } })), '');
  assert.equal(activityLabel({ status: 'cancelled' }), '응답을 중단했습니다');
});
test('reasoning is an escaped, collapsed disclosure, not rendered as an assistant answer', () => {
  const html = renderToStaticMarkup(h(ReasoningSection, { text: '<script>not executable</script>' }));
  assert.match(html, /<details/); assert.doesNotMatch(html, / open|<script>/);
  assert.match(html, /모델 추론/);
});
test('real run phases and reasoning follow event order and reject late reasoning after cancellation', async () => {
  const store = createChatStore({ getItem: () => null, setItem() {} });
  let late;
  store.setDraft('hello');
  await store.send({ documentId: 'doc' }, async ({ onReasoning, onText, onTool }) => {
    assert.equal(store.getSnapshot().phase, 'waiting');
    onReasoning('Provided '); onReasoning('reasoning');
    assert.equal(store.getSnapshot().phase, 'reasoning');
    onTool({ id: 'tool', name: 'search', status: 'running' });
    assert.equal(store.getSnapshot().phase, 'tool');
    onTool({ id: 'tool', name: 'search', status: 'completed' });
    assert.equal(store.getSnapshot().phase, 'waiting');
    onText('Answer'); assert.equal(store.getSnapshot().phase, 'responding');
    late = onReasoning;
    store.cancel();
  });
  const before = store.getSnapshot().timeline;
  late('late'); assert.equal(store.getSnapshot().timeline, before);
  assert.deepEqual(before.map(item => item.kind), ['message', 'reasoning', 'tool', 'message']);
  assert.equal(before[1].text, 'Provided reasoning');
  assert.doesNotMatch(store.getSnapshot().messages.at(-1).text, /reasoning/);
});
