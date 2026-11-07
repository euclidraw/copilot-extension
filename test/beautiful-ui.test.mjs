import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import foundation from '../src/beautiful-ui/foundation.generated.js';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Section } from '../src/beautiful-ui/Section.js';
import { ApprovalCard } from '../src/beautiful-ui/ApprovalCard.js';
import { ToolChips } from '../src/beautiful-ui/ToolChips.js';
import { createChatStore } from '../src/store.js';
import { chatStyle } from '../src/chat-style.js';

test('Beautiful UI surfaces, ink, actions and shadows inherit the actual host theme across Shadow DOM', () => {
  for (const [token, host] of Object.entries({ surface: 'bg-surface', field: 'bg-muted', ink: 'text', 'ink-2': 'text-secondary', line: 'border-subtle', accent: 'accent', green: 'success' })) {
    assert.ok(chatStyle.includes(`--${token}:var(--alid-${host})`), `${token} must follow the host theme`);
  }
  assert.match(chatStyle, /color-scheme:inherit/);
});

test('official foundation is compiled into runtime CSS including tokens and actual utility rules', async () => {
  const upstream = await readFile(new URL('../src/beautiful-ui/upstream/foundation.css', import.meta.url), 'utf8');
  assert.match(upstream, /@import "tailwindcss"/);
  assert.match(foundation, /:host\{/);
  assert.match(foundation, /--surface:oklch/);
  assert.match(foundation, /--ink:oklch/);
  assert.match(foundation, /\.bg-field\{/);
  assert.match(foundation, /\.rounded-control\{/);
  assert.doesNotMatch(foundation, /@import/);
});
test('approval uses upstream card and pill actions with controlled application status', () => {
  const render = status => renderToStaticMarkup(h(ApprovalCard, { proposal: { status, change: { operations: [{ id: 'a' }] } } }));
  assert.match(render('pending'), /data-beautiful-ui="approval-card"/);
  assert.match(render('pending'), /shadow-card/);
  assert.match(render('pending'), /rounded-full/);
  assert.match(render('pending'), /승인 및 적용/);
  assert.match(render('applied'), /적용됨/);
  assert.doesNotMatch(render('rejected'), /승인 및 적용/);
  const previewing = renderToStaticMarkup(h(ApprovalCard, {
    proposal: { status: 'pending', change: { operations: [{ id: 'a' }] } },
    previewing: true,
    onPreview() {},
  }));
  assert.match(previewing, /캔버스 미리보기 중/);
});
test('rejected proposals cannot be applied', async () => {
  const store = createChatStore({ getItem: () => null, setItem() {} });
  store.setDraft('edit');
  await store.send({ documentId: 'd' }, async ({ onProposal }) => onProposal({ id: 'p', operations: [] }));
  store.reject('p');
  store.apply('p', { apply() { assert.fail('rejected change must not apply'); } });
  assert.equal(store.getSnapshot().proposals[0].status, 'rejected');
});
test('shared Section preserves upstream label hierarchy and body typography', () => {
  const html = renderToStaticMarkup(h(Section, { label: 'Copilot', sub: '진행 중', time: '3초' }, 'Real content'));
  assert.match(html, /gap-1\.5/);
  assert.match(html, /font-medium text-ink/);
  assert.match(html, /text-ink-2/);
  assert.match(html, /Real content/);
});
test('ToolChips groups consecutive tool calls and collapses when all tools complete', () => {
  const runningHtml = renderToStaticMarkup(h(ToolChips, {
    tools: [{ id: '1', name: 'tools_search', status: 'running' }],
    notes: ['도구 검색 중'],
  }));
  assert.match(runningHtml, /data-beautiful-ui="tool-chips"/);
  assert.match(runningHtml, /도구 실행 중 \(0\/1\)/);
  assert.match(runningHtml, /aria-expanded="true"/);

  const doneHtml = renderToStaticMarkup(h(ToolChips, {
    tools: [
      { id: '1', name: 'tools_search', status: 'completed' },
      { id: '2', name: 'tool_invoke', status: 'completed' },
    ],
    notes: ['도구 검색 완료'],
  }));
  assert.match(doneHtml, /도구 2개 실행됨/);
  assert.match(doneHtml, /aria-expanded="false"/);
  assert.match(doneHtml, /hidden=""/);
});
