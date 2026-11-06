// Adapted from Beautiful UI ChatComposer.tsx, copyright (c) 2026 Shane Levine.
// MIT; see THIRD_PARTY_NOTICES.md. Demo phase timers/replies removed; controlled
// draft, real streaming content, multiline input and CJK IME guards added.
import { createElement as h, useRef } from 'react';

export function ChatComposer({ tab, onTab, conversation, activity, draft, onDraft, onSend, running, onCancel, model, selection, onFolder, folderConnected, folderAvailable }) {
  const input = useRef(null), composing = useRef(false), ended = useRef(-Infinity);
  const send = () => {
    if (composing.current || performance.now() - ended.current < 16 || running || !draft.trim()) return;
    onSend();
  };
  return h('div', { className: 'bui-chat', 'data-beautiful-ui': 'chat-composer' },
    h('div', { className: 'bui-chat-bar' },
      h('div', { className: 'bui-tabs', 'aria-label': 'Copilot 보기' },
        ...[['chat', '대화'], ['settings', '연결 설정']].map(([id, label]) => h('button', { key: id, type: 'button', 'aria-pressed': tab === id, onClick: () => onTab(id) }, label))),
      h('span', { className: 'bui-state', role: 'status' }, running ? '응답 중' : 'Copilot')),
    h('div', { className: 'bui-thread' }, conversation, activity),
    tab === 'chat' && h('div', { className: 'bui-compose-wrap' },
      h('div', { className: 'bui-context' }, h('span', null, `선택 ${selection}개`), h('span', null, '현재 캔버스')),
      h('div', { className: 'bui-composer', onClick: () => input.current?.focus() },
        h('textarea', { ref: input, value: draft, 'aria-label': '메시지', placeholder: '무엇을 도와드릴까요?', rows: 3,
          onChange: event => onDraft(event.target.value),
          onCompositionStart: () => { composing.current = true; },
          onCompositionEnd: () => { composing.current = false; ended.current = performance.now(); },
          onKeyDown: event => {
            if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229 || event.key === 'Process' || performance.now() - ended.current < 16) return;
            if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
          } }),
        h('div', { className: 'bui-compose-actions' },
          h('button', { type: 'button', className: 'bui-folder', disabled: running || folderConnected || !folderAvailable,
            onClick: event => { event.stopPropagation(); onFolder(); } }, folderConnected ? '폴더 연결됨' : '+ 폴더'),
          h('span', { className: 'bui-model', title: model }, model),
          h('button', { type: 'button', className: 'bui-send', 'aria-label': running ? '응답 중단' : '메시지 보내기', disabled: !running && !draft.trim(),
            onClick: event => { event.stopPropagation(); running ? onCancel() : send(); } },
            h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
              running ? h('rect', { x: 6, y: 6, width: 12, height: 12, rx: 2 }) : h('path', { d: 'M12 19V5M5 12l7-7 7 7' }))))),
      h('p', { className: 'bui-hint' }, '변경은 승인 후 적용 · Shift + Enter 줄바꿈')));
}
