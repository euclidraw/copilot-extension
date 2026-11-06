import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatComposer } from '../src/beautiful-ui/ChatComposer.js';

test('official ChatComposer adaptation renders integrated composer and functional view controls', () => {
  const html = renderToStaticMarkup(createElement(ChatComposer, { tab: 'chat', draft: '', model: 'test-model', selection: 2, conversation: 'Real conversation' }));
  assert.match(html, /data-beautiful-ui="chat-composer"/);
  assert.match(html, /bui-composer/);
  assert.match(html, /연결 설정/);
  assert.match(html, /선택 2개/);
  assert.match(html, /Real conversation/);
  assert.doesNotMatch(html, /mint chip|Sales History|Flavor Data/);
});
test('settings view removes composer and running chat has an accessible stop action', () => {
  const settings = renderToStaticMarkup(createElement(ChatComposer, { tab: 'settings', conversation: 'Settings' }));
  assert.doesNotMatch(settings, /<textarea/);
  const running = renderToStaticMarkup(createElement(ChatComposer, { tab: 'chat', running: true, draft: '', selection: 0 }));
  assert.match(running, /aria-label="응답 중단"/);
});
