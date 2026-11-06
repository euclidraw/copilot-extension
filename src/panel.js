import { createElement as h, useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { createRunner } from './runner.js';
import { createWorkspaceFiles } from './files.js';
import { chatStyle } from './chat-style.js';

const css = `:host{color:var(--text-primary,#2f3437)}.copilot{display:flex;flex-direction:column;height:100%;padding:16px;box-sizing:border-box;font:13px/1.6 system-ui,sans-serif;gap:16px}.copilot header{display:flex;justify-content:space-between}.copilot h2{font-size:16px;margin:0}.copilot small{color:var(--text-secondary,#787774)}.copilot .context{font-size:11px;border-block:1px solid #eaeaea;padding:8px 0}.copilot .messages{flex:1;overflow:auto;min-height:60px}.copilot article{padding:12px 0;border-bottom:1px solid #eaeaea;white-space:pre-wrap;overflow-wrap:anywhere}.copilot textarea{box-sizing:border-box;width:100%;min-height:100px;resize:vertical;background:transparent;color:inherit;border:1px solid #eaeaea;border-radius:6px;padding:10px;font:inherit}.copilot button{border:1px solid #eaeaea;border-radius:4px;padding:7px 12px;background:#2f3437;color:white;cursor:pointer}.copilot button:disabled{opacity:.4}.copilot footer{display:flex;justify-content:space-between;align-items:center}.copilot [role=alert]{color:#9f2f2d}`;
export function ChatPanel({ store, panelContext, run, changes, tools }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [config, setConfig] = useState({ endpoint: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', apiKey: '' });
  const [files, setFiles] = useState(null), [fileError, setFileError] = useState('');
  const [selected, setSelected] = useState(() => [...panelContext.getSelectedIds()]);
  const composing = useRef(false), ended = useRef(-Infinity);
  useEffect(() => panelContext.onSelectionChange(ids => setSelected([...ids])), [panelContext]);
  useEffect(() => () => store.cancel(), [store]);
  const send = () => {
    if (composing.current || performance.now() - ended.current < 16) return;
    if (!changes?.getContext) { setFileError('호스트 업데이트가 필요합니다: 문서 수명주기 서비스 없음'); return; }
    const { documentId, viewId, signal } = changes.getContext();
    const selectedIds = [...panelContext.getSelectedIds()].slice(0, 100);
    const snapshot = panelContext.world.exportCanonicalSnapshot();
    const entities = selectedIds.map(id => ({ id, aspects: snapshot[id], source: 'canonical' }));
    const schemas = Object.fromEntries([...new Set(entities.flatMap(entity => Object.keys(entity.aspects ?? {})))].map(aspect => [aspect, { metadata: panelContext.world.getCanonicalSchema(aspect), semanticDescriptor: null }]));
    return store.send({ documentId, viewId, selectedIds, entities, schemas }, run ?? (config.apiKey ? createRunner(config, files, tools) : undefined), signal);
  };
  return h('section', { className: 'copilot', 'aria-label': 'AI chat' },
    h('style', null, css + chatStyle),
    h('header', null, h('h2', null, 'Copilot'), h('small', null, state.status)),
    h('div', { className: 'context' }, `현재 캔버스 · 선택 ${selected.length}개`),
    h('details', null, h('summary', null, '모델 연결 (현재 세션만)'),
      ...['endpoint', 'model', 'apiKey'].map(field => h('label', { key: field, style: { display: 'block' } }, field,
        h('input', { type: field === 'apiKey' ? 'password' : 'text', value: config[field], autoComplete: 'off',
          onChange: event => setConfig({ ...config, [field]: event.target.value }) }))),
      h('small', null, '키는 저장하지 않습니다. endpoint 운영자에게 선택 데이터를 보냅니다.')),
    h('button', { disabled: state.status === 'running' || !!files || !globalThis.showDirectoryPicker, onClick: async () => {
      try { setFiles(createWorkspaceFiles(await showDirectoryPicker({ mode: 'readwrite' }))); }
      catch (error) { if (error.name !== 'AbortError') setFileError(String(error.message)); }
    } }, files ? '폴더 연결됨 · 파일 변경은 개별 승인' : '작업 폴더 연결'),
    fileError && h('div', { role: 'alert' }, fileError),
    h('div', { className: 'messages', 'aria-live': 'polite', role: 'log' },
      !state.messages.length && h('p', null, '현재 선택을 문맥으로 사용합니다. 필요한 작업을 적어 주세요.'),
      ...state.messages.map((message, index) => h('article', { key: index, 'data-role': message.role }, h('small', null, message.role === 'user' ? 'You' : 'Copilot'), h('div', null, message.text)))),
    !!state.tools?.length && h('div', { className: 'tool-chips', 'aria-label': '도구 실행 기록' }, ...state.tools.map(tool => h('span', { key: tool.id, className: 'tool-chip', 'data-status': tool.status }, `${tool.name} · ${tool.status}`))),
    state.error && h('div', { role: 'alert' }, state.error),
    ...state.proposals.map(proposal => h('details', { key: proposal.change.id },
      h('summary', null, `변경 제안 · ${proposal.status}`),
      h('pre', { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 200, overflow: 'auto' } }, JSON.stringify(proposal.change.kind === 'file' ? { path: proposal.change.path, text: proposal.change.text, expectedRevision: proposal.change.expectedRevision } : proposal.change.operations, null, 2)),
      proposal.change.kind === 'file' && h('small', null, '외부 편집과 원자적 비교 불가. 파일은 캔버스 Undo에 포함되지 않습니다.'),
      h('button', { disabled: (proposal.change.kind === 'file' ? !files : !changes) || proposal.status !== 'pending' || state.status === 'running', onClick: () => proposal.change.kind === 'file' ? store.applyFile(proposal.change.id, files, changes?.getContext()) : store.apply(proposal.change.id, changes) }, proposal.change.kind === 'file' ? '파일 쓰기 승인' : '검증 후 적용 (Undo 가능)'))),
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
