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
        ...[['chat', '대화'], ['settings', '연결 설정']].map(([id, label]) => h('button', {
          key: id,
          type: 'button',
          className: `rounded-[6px] px-2 py-[3px] text-[13px] text-ink transition-[background-color,opacity] duration-100 ${tab === id ? 'bg-field font-medium' : 'opacity-55 hover:opacity-80'}`,
          'aria-pressed': tab === id,
          onClick: () => onTab(id),
        }, label))),
      h('div', { className: 'bui-header-actions' },
        h('button', {
          type: 'button',
          className: 'bui-new-session inline-flex h-6 items-center gap-1 rounded-[6px] px-2 text-[12px] text-ink-2 transition-colors duration-100 hover:bg-hover hover:text-ink',
          onClick: onNewSession,
          'aria-label': '새 대화 시작',
          title: '연결 설정을 유지하고 대화를 초기화합니다',
        }, '+ 새 대화'))),
    h('div', { ref: thread, className: 'bui-thread flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pt-3 pb-2' }, conversation, activity),
    tab === 'chat' && h('div', { className: 'bui-compose-wrap p-1.5' },
      h('div', {
        className: 'bui-composer flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong',
        onClick: () => input.current?.focus(),
      },
        h('textarea', {
          ref: input,
          value: draft,
          'aria-label': '메시지',
          placeholder: '무엇을 도와드릴까요? (Enter 전송 · Shift+Enter 줄바꿈)',
          rows: 2,
          onChange: event => onDraft(event.target.value),
          onCompositionStart: () => { composing.current = true; },
          onCompositionEnd: () => { composing.current = false; ended.current = performance.now(); },
          onKeyDown: event => {
            if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229 || event.key === 'Process' || performance.now() - ended.current < 16) return;
            if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
          },
        }),
        h('div', { className: 'bui-compose-actions flex items-center gap-1.5' },
          h('span', {
            className: `inline-flex h-6 items-center rounded-chip px-2 text-[11.5px] shadow-hairline ${selection > 0 ? 'bg-surface font-medium text-ink' : 'bg-surface/60 text-ink-2'}`,
          }, `선택 ${selection}개`),
          h('button', {
            type: 'button',
            className: 'bui-folder inline-flex h-6 items-center rounded-chip px-2 text-[11.5px] text-ink-2 transition-colors duration-100 hover:bg-hover hover:text-ink',
            disabled: running || folderConnected || !folderAvailable,
            onClick: event => { event.stopPropagation(); onFolder(); },
          }, folderConnected ? '폴더 연결됨' : '+ 폴더'),
          h('button', {
            type: 'button',
            className: 'bui-model ml-auto inline-flex h-6 max-w-[136px] items-center truncate rounded-chip px-2 text-[11.5px] text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink-2',
            title: `${model} · 클릭하여 연결 설정 열기`,
            onClick: event => { event.stopPropagation(); onTab?.('settings'); },
          }, model),
          h('button', {
            type: 'button',
            className: 'bui-send',
            'aria-label': running ? '응답 중단' : '메시지 보내기',
            disabled: !running && !draft.trim(),
            onClick: event => { event.stopPropagation(); running ? onCancel() : send(); },
          },
            h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
              running ? h('rect', { x: 6, y: 6, width: 12, height: 12, rx: 2 }) : h('path', { d: 'M12 19V5M5 12l7-7 7 7' })))))));
}

export function scrollThreadToEnd(element) {
  element.scrollTop = element.scrollHeight;
}
