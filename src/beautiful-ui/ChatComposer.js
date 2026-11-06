// Adapted from Beautiful UI ChatComposer.tsx, copyright (c) 2026 Shane Levine.
// MIT; see THIRD_PARTY_NOTICES.md. Demo phase timers/replies removed; controlled
// draft, real streaming content, multiline input and CJK IME guards added.
import { createElement as h, useRef, useEffect } from 'react';

export function ChatComposer({ tab, onTab, conversation, activity, draft, onDraft, onSend, running, onCancel, onNewSession, model, selection, onFolder, folderConnected, folderAvailable }) {
  const input = useRef(null), composing = useRef(false), ended = useRef(-Infinity);
  const thread = useRef(null);
  useEffect(() => {
    if (tab === 'chat' && thread.current) scrollThreadToEnd(thread.current);
  }, [tab, conversation, activity]);
  const send = () => {
    if (composing.current || performance.now() - ended.current < 16 || running || !draft.trim()) return;
    onSend();
  };
  return h('div', { className: 'bui-chat', 'data-beautiful-ui': 'chat-composer' },
    h('div', { className: 'flex shrink-0 items-center justify-between border-b border-line p-1.5' },
      h('div', { className: 'bui-tabs', 'aria-label': 'Copilot 보기' },
        ...[['chat', '대화'], ['settings', '연결 설정']].map(([id, label]) => h('button', { key: id, type: 'button', className: `rounded-[6px] px-2 py-[3px] text-[13px] text-ink transition-[background-color,opacity] duration-100 ${tab === id ? 'bg-field' : 'opacity-50 hover:opacity-75'}`, 'aria-pressed': tab === id, onClick: () => onTab(id) }, label))),
      h('div', { className: 'bui-header-actions' },
        h('span', { className: 'bui-state', role: 'status' }, running ? '응답 중' : 'Copilot'),
        h('button', { type: 'button', className: 'bui-new-session', onClick: onNewSession, 'aria-label': '새 대화 시작', title: '연결 설정을 유지하고 대화를 초기화합니다' }, '+ 새 대화'))),
    h('div', { ref: thread, className: 'bui-thread flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pt-2.5 pb-1' }, conversation, activity),
    tab === 'chat' && h('div', { className: 'bui-compose-wrap' },
      h('div', { className: 'bui-context' }, h('span', null, `선택 ${selection}개`), h('span', null, '현재 캔버스')),
      h('div', { className: 'bui-composer flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong', onClick: () => input.current?.focus() },
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

export function scrollThreadToEnd(element) {
  element.scrollTop = element.scrollHeight;
}
