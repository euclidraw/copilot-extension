import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatStore } from '../src/store.js';
import { scrollThreadToEnd } from '../src/beautiful-ui/ChatComposer.js';

test('messages, tool calls and approvals stay in arrival order while status updates stay in place', async () => {
  const store = createChatStore({ getItem: () => null, setItem() {} });
  store.setDraft('Create family');
  await store.send({ documentId: 'doc' }, async ({ onText, onTool, onProposal }) => {
    onText('Before');
    onTool({ id: 't', name: 'plan', status: 'running' });
    onProposal({ id: 'p', operations: [] });
    onTool({ id: 't', name: 'plan', status: 'completed' });
    onText('After'); onText(' approval');
  });
  const state = store.getSnapshot();
  assert.deepEqual(state.timeline.map(item => item.kind), ['message', 'message', 'tool', 'proposal', 'message']);
  assert.equal(state.timeline[1].text, 'Before');
  assert.equal(state.timeline[2].status, 'completed');
  assert.equal(state.timeline[4].text, 'After approval');
  assert.equal(state.messages.at(-1).text, 'BeforeAfter approval');
  store.apply('p', { apply: () => ({ applied: 1 }) });
  assert.equal(store.getSnapshot().proposals[0].status, 'applied');
  assert.equal(store.getSnapshot().timeline[3].id, 'p');
  store.setDraft('Next');
  await store.send({ documentId: 'doc' }, async ({ onText }) => onText('Next reply'));
  assert.deepEqual(store.getSnapshot().timeline.slice(-2).map(item => item.text), ['Next', 'Next reply']);
});

test('existing persisted messages load as an ordered timeline without stale approvals', () => {
  const messages = [{ role: 'user', text: 'one' }, { role: 'assistant', text: 'two' }];
  const store = createChatStore({ getItem: () => JSON.stringify({ messages }), setItem() {} });
  assert.deepEqual(store.getSnapshot().timeline.map(item => item.text), ['one', 'two']);
  assert.deepEqual(store.getSnapshot().proposals, []);
});

test('scroll follows the current bottom after content grows', () => {
  const element = { scrollTop: 0, scrollHeight: 800 };
  scrollThreadToEnd(element); assert.equal(element.scrollTop, 800);
  element.scrollHeight = 1200;
  scrollThreadToEnd(element); assert.equal(element.scrollTop, 1200);
});

test('turn grouping places reasoning and tools before the main answer and anchors proposals at the bottom of the turn', async () => {
  const { groupTimelineIntoTurns } = await import('../src/turn-view.js');
  const timeline = [
    { kind: 'message', role: 'user', text: '4인 핵가족 만들어줘' },
    { kind: 'reasoning', text: '스키마부터 확인' },
    { kind: 'message', role: 'assistant', text: '도구를 확인하겠습니다.' },
    { kind: 'tool', id: 't1', name: 'tools_search', status: 'completed' },
    { kind: 'tool', id: 't2', name: 'tool_invoke', status: 'completed' },
    { kind: 'proposal', id: 'p1' },
    { kind: 'message', role: 'assistant', text: '4인 핵가족 제안서를 생성했습니다.' },
  ];
  const proposals = [{ change: { id: 'p1', operations: [{ id: 'a' }] }, status: 'pending' }];
  const turns = groupTimelineIntoTurns(timeline, proposals);
  assert.equal(turns.length, 1);
  assert.equal(turns[0].user.text, '4인 핵가족 만들어줘');
  assert.equal(turns[0].reasoning, '스키마부터 확인');
  assert.equal(turns[0].tools.length, 2);
  assert.deepEqual(turns[0].notes, ['도구를 확인하겠습니다.']);
  assert.equal(turns[0].assistantText, '4인 핵가족 제안서를 생성했습니다.');
  assert.equal(turns[0].proposals.length, 1);
  assert.equal(turns[0].proposals[0].change.id, 'p1');
});
