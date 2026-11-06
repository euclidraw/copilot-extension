import { createElement as h, useEffect, useState, useSyncExternalStore } from 'react';
import { createRunner } from './runner.js';
import { createWorkspaceFiles } from './files.js';
import { chatStyle } from './chat-style.js';
import { ChatComposer } from './beautiful-ui/ChatComposer.js';

export function ChatPanel({ store, panelContext, run, changes, tools }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [config, setConfig] = useState({ endpoint: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', apiKey: '' });
  const [tab, setTab] = useState('chat');
  const [files, setFiles] = useState(null), [fileError, setFileError] = useState('');
  const [selected, setSelected] = useState(() => [...panelContext.getSelectedIds()]);
  useEffect(() => panelContext.onSelectionChange(ids => setSelected([...ids])), [panelContext]);
  useEffect(() => () => store.cancel(), [store]);
  const send = () => {
    if (!changes?.getContext) { setFileError('호스트 업데이트가 필요합니다: 문서 수명주기 서비스 없음'); return; }
    const { documentId, viewId, signal } = changes.getContext();
    const selectedIds = [...panelContext.getSelectedIds()].slice(0, 100);
    const snapshot = panelContext.world.exportCanonicalSnapshot();
    const entities = selectedIds.map(id => ({ id, aspects: snapshot[id], source: 'canonical' }));
    const schemas = Object.fromEntries([...new Set(entities.flatMap(entity => Object.keys(entity.aspects ?? {})))].map(aspect => [aspect, { metadata: panelContext.world.getCanonicalSchema(aspect), semanticDescriptor: null }]));
    return store.send({ documentId, viewId, selectedIds, entities, schemas }, run ?? (config.apiKey ? createRunner(config, files, tools) : undefined), signal);
  };
  const settings = h('div', { className: 'bui-settings' },
    h('strong', null, '모델 연결'),
    ...[['endpoint', 'API 주소'], ['model', '모델'], ['apiKey', 'API 키']].map(([field, label]) => h('label', { key: field }, label,
      h('input', { type: field === 'apiKey' ? 'password' : 'text', value: config[field], autoComplete: 'off', onChange: event => setConfig({ ...config, [field]: event.target.value }) }))),
    h('small', null, '키는 현재 세션에만 유지됩니다. 요청 시 API 주소 운영자에게 선택한 문맥을 전송합니다.'));
  const conversation = tab === 'settings' ? settings : h('div', { style: { display: 'contents' } },
    !state.messages.length && h('div', { className: 'bui-empty' }, h('h3', null, '캔버스에서 함께 작업하기'), h('p', null, '선택한 내용을 살펴보고 변경을 제안합니다. 연결 설정에서 모델을 연결해 시작하세요.')),
    ...state.messages.map((message, index) => h('article', { key: index, className: 'bui-message', 'data-role': message.role }, message.role !== 'user' && h('small', null, 'Copilot'), h('div', null, message.text))),
    !!state.tools?.length && h('div', { className: 'bui-tool-list', 'aria-label': '도구 실행 기록' }, ...state.tools.map(tool => h('span', { key: tool.id, className: 'bui-tool', 'data-status': tool.status }, `${tool.name} · ${{ running: '실행 중', completed: '완료', failed: '실패' }[tool.status] ?? tool.status}`))),
    ...state.proposals.map(proposal => h('section', { key: proposal.change.id, className: 'bui-approval', 'aria-label': '변경 승인' },
      h('div', { className: 'bui-approval-title' }, proposal.change.kind === 'file' ? '파일 변경을 승인할까요?' : '캔버스 변경을 승인할까요?'),
      h('pre', null, JSON.stringify(proposal.change.kind === 'file' ? { path: proposal.change.path, text: proposal.change.text } : proposal.change.operations, null, 2)),
      h('footer', null, h('small', null, proposal.change.kind === 'file' ? '외부 편집과 원자적 비교 불가 · 파일 Undo 제외' : '원본 일치 검사 · 단일 Undo'),
        h('button', { disabled: (proposal.change.kind === 'file' ? !files : !changes) || proposal.status !== 'pending' || state.status === 'running', onClick: () => proposal.change.kind === 'file' ? store.applyFile(proposal.change.id, files, changes?.getContext()) : store.apply(proposal.change.id, changes) }, proposal.status === 'applied' ? '적용됨' : proposal.status === 'pending' ? '승인 및 적용' : proposal.status)))));
  return h('section', { className: 'copilot', 'aria-label': 'AI chat' },
    h('style', null, chatStyle),
    h(ChatComposer, { tab, onTab: setTab, conversation,
      activity: (fileError || state.error) && h('div', { role: 'alert', className: 'bui-error' }, fileError || state.error),
      draft: state.draft, onDraft: store.setDraft, onSend: send, running: state.status === 'running', onCancel: () => store.cancel(),
      model: config.model, selection: selected.length, folderConnected: !!files, folderAvailable: !!globalThis.showDirectoryPicker,
      onFolder: async () => { try { setFiles(createWorkspaceFiles(await showDirectoryPicker({ mode: 'readwrite' }))); } catch (error) { if (error.name !== 'AbortError') setFileError(String(error.message)); } },
    }));
}
