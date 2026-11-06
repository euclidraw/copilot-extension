import { createElement as h, useEffect, useState, useSyncExternalStore } from 'react';
import { createRunner } from './runner.js';
import { createWorkspaceFiles } from './files.js';
import { chatStyle } from './chat-style.js';
import { ChatComposer } from './beautiful-ui/ChatComposer.js';
import { MessageMarkdown } from './markdown.js';
import { RunActivity } from './beautiful-ui/RunActivity.js';
import { ThinkingState } from './beautiful-ui/ThinkingState.js';
import { ApprovalCard } from './beautiful-ui/ApprovalCard.js';
import { Section } from './beautiful-ui/Section.js';
import { loadConnection, saveConnection, clearConnection, defaultConnection } from './connection.js';

export function ChatPanel({ store, panelContext, run, changes, tools }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [config, setConfig] = useState(loadConnection);
  const [connectionStatus, setConnectionStatus] = useState('');
  const updateConfig = (field, value) => {
    const next = { ...config, [field]: value };
    setConfig(next);
    setConnectionStatus(saveConnection(next) ? '이 브라우저에 저장했습니다.' : '저장할 수 없습니다. 현재 열린 패널에서만 유지됩니다.');
  };
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
      h('input', { type: field === 'apiKey' ? 'password' : 'text', value: config[field], autoComplete: 'off', onChange: event => updateConfig(field, event.target.value) }))),
    h('small', null, '변경 사항은 이 브라우저에 자동 저장되며 확장 업데이트 후에도 유지됩니다. API 키는 암호화되지 않은 로컬 저장소에 보관됩니다. 공용 기기에서는 사용 후 지워 주세요. 요청 시 API 주소 운영자에게 선택한 문맥을 전송합니다.'),
    h('button', { type: 'button', onClick: () => {
      const cleared = clearConnection();
      setConfig({ ...defaultConnection });
      setConnectionStatus(cleared ? '저장된 연결을 지웠습니다.' : '저장된 연결을 지우지 못했습니다. 브라우저 사이트 데이터 설정을 확인해 주세요.');
    } }, '저장된 연결 지우기'),
    h('small', { role: 'status' }, connectionStatus));
  const conversation = tab === 'settings' ? settings : h('div', { style: { display: 'contents' } },
    !state.messages.length && h('div', { className: 'bui-empty' }, h('h3', null, '캔버스에서 함께 작업하기'), h('p', null, '선택한 내용을 살펴보고 변경을 제안합니다. 연결 설정에서 모델을 연결해 시작하세요.')),
    ...state.timeline.map((item, index) => {
      if (item.kind === 'reasoning') return h(ThinkingState, { key: index, text: item.text, working: state.status === 'running' && state.phase === 'reasoning' && index === state.timeline.length - 1 });
      if (item.kind === 'message') return h('article', { key: index, className: 'bui-message', 'data-role': item.role }, item.role === 'user' ? h(MessageMarkdown, { text: item.text }) : h(Section, { label: 'Copilot' }, h(MessageMarkdown, { text: item.text })));
      if (item.kind === 'tool') return h('div', { key: index, className: 'bui-tool-list', 'aria-label': '도구 실행 기록' }, h('span', { className: 'bui-tool', 'data-status': item.status }, `${item.name} · ${{ running: '실행 중', completed: '완료', failed: '실패' }[item.status] ?? item.status}`));
      const proposal = state.proposals.find(proposal => proposal.change.id === item.id);
      if (!proposal) return null;
      return h(ApprovalCard, { key: index, proposal,
        disabled: (proposal.change.kind === 'file' ? !files : !changes) || state.status === 'running',
        onReject: () => store.reject(proposal.change.id),
        onApprove: () => proposal.change.kind === 'file' ? store.applyFile(proposal.change.id, files, changes?.getContext()) : store.apply(proposal.change.id, changes),
      });
    }));
  return h('section', { className: 'copilot', 'aria-label': 'AI chat' },
    h('style', null, chatStyle),
    h(ChatComposer, { tab, onTab: setTab, conversation,
      onNewSession: () => {
        if ((state.messages.length || state.draft || state.proposals.length) && !globalThis.confirm('새 대화를 시작할까요? 현재 대화·초안·승인 대기 내역은 삭제되며 복구할 수 없습니다. 실행 중인 요청은 중단됩니다. 연결 설정과 캔버스는 유지됩니다.')) return;
        store.newSession(); setFileError(''); setTab('chat');
      },
      activity: tab === 'chat' && h('div', { className: 'bui-activity-stack' },
        h(RunActivity, { state }),
        state.proposals.some(item => item.status === 'pending') && h('p', { className: 'bui-approval-notice', role: 'status' }, '승인 대기 중 · 위 변경 카드의 내역을 확인해 주세요.'),
        (fileError || state.error) && h('div', { role: 'alert', className: 'bui-error' }, fileError || state.error)),
      draft: state.draft, onDraft: store.setDraft, onSend: send, running: state.status === 'running', onCancel: () => store.cancel(),
      model: config.model, selection: selected.length, folderConnected: !!files, folderAvailable: !!globalThis.showDirectoryPicker,
      onFolder: async () => { try { setFiles(createWorkspaceFiles(await showDirectoryPicker({ mode: 'readwrite' }))); } catch (error) { if (error.name !== 'AbortError') setFileError(String(error.message)); } },
    }));
}
