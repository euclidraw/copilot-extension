import { createElement as h, useEffect, useState, useSyncExternalStore, useRef } from 'react';

const css = `:host{color:var(--text-primary,#2f3437)}.copilot{display:flex;flex-direction:column;height:100%;padding:16px;box-sizing:border-box;font:13px/1.6 system-ui,sans-serif;gap:16px}.copilot header{display:flex;justify-content:space-between}.copilot h2{font-size:16px;margin:0}.copilot small{color:var(--text-secondary,#787774)}.copilot .context{font-size:11px;border-block:1px solid #eaeaea;padding:8px 0}.copilot .messages{flex:1;overflow:auto;min-height:60px}.copilot article{padding:12px 0;border-bottom:1px solid #eaeaea;white-space:pre-wrap;overflow-wrap:anywhere}.copilot textarea{box-sizing:border-box;width:100%;min-height:100px;resize:vertical;background:transparent;color:inherit;border:1px solid #eaeaea;border-radius:6px;padding:10px;font:inherit}.copilot button{border:1px solid #eaeaea;border-radius:4px;padding:7px 12px;background:#2f3437;color:white;cursor:pointer}.copilot button:disabled{opacity:.4}.copilot footer{display:flex;justify-content:space-between;align-items:center}.copilot [role=alert]{color:#9f2f2d}`;
export function ChatPanel({ store, panelContext, run }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [selected, setSelected] = useState(() => [...panelContext.getSelectedIds()]);
  const composing = useRef(false), ended = useRef(-Infinity);
  useEffect(() => panelContext.onSelectionChange(ids => setSelected([...ids])), [panelContext]);
  useEffect(() => () => store.cancel(), [store]);
  const send = () => store.send({ selectedIds: [...panelContext.getSelectedIds()] }, run);
  return h('section', { className: 'copilot', 'aria-label': 'AI chat' },
    h('style', null, css),
    h('header', null, h('h2', null, 'Copilot'), h('small', null, state.status)),
    h('div', { className: 'context' }, `현재 캔버스 · 선택 ${selected.length}개`),
    h('div', { className: 'messages', 'aria-live': 'polite', role: 'log' },
      !state.messages.length && h('p', null, '현재 선택을 문맥으로 사용합니다. 필요한 작업을 적어 주세요.'),
      ...state.messages.map((message, index) => h('article', { key: index }, h('small', null, message.role === 'user' ? 'You' : 'Copilot'), h('div', null, message.text)))),
    state.error && h('div', { role: 'alert' }, state.error),
    h('textarea', { value: state.draft, 'aria-label': '메시지', placeholder: '캔버스에 관해 요청하기…',
      onChange: event => store.setDraft(event.target.value),
      onCompositionStart: () => { composing.current = true; },
      onCompositionEnd: () => { composing.current = false; ended.current = performance.now(); },
      onKeyDown(event) {
        if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229 || event.key === 'Process' || performance.now() - ended.current < 16) return;
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
      },
    }),
    h('footer', null, h('small', null, 'Shift + Enter 줄바꿈'), state.status === 'running'
      ? h('button', { onClick: () => store.cancel() }, '중단')
      : h('button', { onClick: send, disabled: !state.draft.trim() }, '보내기')));
}
