import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import foundation from '../src/beautiful-ui/foundation.generated.js';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Section } from '../src/beautiful-ui/Section.js';
import { ApprovalCard } from '../src/beautiful-ui/ApprovalCard.js';
import { createChatStore } from '../src/store.js';

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
