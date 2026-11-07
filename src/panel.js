import { createElement as h, useEffect, useState, useSyncExternalStore } from 'react';
import { createRunner } from './runner.js';
import { createWorkspaceFiles } from './files.js';
import { chatStyle } from './chat-style.js';
import { ChatComposer } from './beautiful-ui/ChatComposer.js';
import { MessageMarkdown } from './markdown.js';
import { RunActivity } from './beautiful-ui/RunActivity.js';
import { ThinkingState } from './beautiful-ui/ThinkingState.js';
import { ToolChips } from './beautiful-ui/ToolChips.js';
import { ApprovalCard } from './beautiful-ui/ApprovalCard.js';
import { Section } from './beautiful-ui/Section.js';
import { Button } from './beautiful-ui/Button.js';
import { groupTimelineIntoTurns } from './turn-view.js';
import { loadConnection, saveConnection, clearConnection, defaultConnection, outputTokens, MAX_OUTPUT_TOKENS } from './connection.js';

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
  const [focusedProposalId, setFocusedProposalId] = useState(null);
  const pendingCanvasProposals = state.proposals.filter(item => item.status === 'pending' && item.change.kind !== 'file');
  const activePreviewProposal = pendingCanvasProposals.find(item => item.change.id === focusedProposalId) ?? pendingCanvasProposals.at(-1) ?? null;

  useEffect(() => panelContext.onSelectionChange(ids => setSelected([...ids])), [panelContext]);
  useEffect(() => {
    try { changes?.preview?.(activePreviewProposal ? activePreviewProposal.change : null); }
    catch { /* Stale or conflicting proposal previews fail closed without crashing UI. */ }
  }, [changes, activePreviewProposal?.change?.id]);
  useEffect(() => () => {
    try { changes?.preview?.(null); } catch { /* Ignore disposal errors. */ }
    store.cancel();
  }, [store, changes]);
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
    h('div', { className: 'flex items-center justify-between' },
      h('strong', { className: 'text-[14px] font-medium text-ink' }, '모델 연결'),
      h(Button, { onClick: () => setTab('chat') }, '대화로 돌아가기')),
    ...[['endpoint', 'API 주소'], ['model', '모델'], ['apiKey', 'API 키']].map(([field, label]) => h('label', { key: field }, label,
      h('input', { type: field === 'apiKey' ? 'password' : 'text', value: config[field], autoComplete: 'off', onChange: event => updateConfig(field, event.target.value) }))),
    h('label', null, '최대 출력 토큰',
      h('input', { type: 'number', min: 256, max: MAX_OUTPUT_TOKENS, step: 1024, inputMode: 'numeric', value: config.maxTokens, autoComplete: 'off', onChange: event => updateConfig('maxTokens', event.target.value) })),
    h('small', null, `응답 1회의 최대 길이입니다. 현재 ${outputTokens(config.maxTokens).toLocaleString()} 토큰으로 요청합니다. 모델의 지원 한도보다 크면 API가 요청을 거부할 수 있으니, 오류가 나면 값을 낮춰 주세요. (256~${MAX_OUTPUT_TOKENS.toLocaleString()})`),
    h('small', null, '변경 사항은 이 브라우저에 자동 저장되며 확장 업데이트 후에도 유지됩니다. API 키는 암호화되지 않은 로컬 저장소에 보관됩니다. 공용 기기에서는 사용 후 지워 주세요. 요청 시 API 주소 운영자에게 선택한 문맥을 전송합니다.'),
    h('div', { className: 'flex items-center justify-between gap-2' },
      h(Button, { onClick: () => {
        const cleared = clearConnection();
        setConfig({ ...defaultConnection });
        setConnectionStatus(cleared ? '저장된 연결을 지웠습니다.' : '저장된 연결을 지우지 못했습니다. 브라우저 사이트 데이터 설정을 확인해 주세요.');
      } }, '저장된 연결 지우기'),
      connectionStatus && h('small', { role: 'status' }, connectionStatus)));

  const turns = groupTimelineIntoTurns(state.timeline, state.proposals);
  const conversation = tab === 'settings' ? settings : h('div', { style: { display: 'contents' } },
    !turns.length && h('div', { className: 'bui-empty' },
      h('h3', null, '캔버스에서 함께 작업하기'),
      h('p', null, '선택한 내용을 살펴보고 생성·수정·관계 설정을 제안합니다. 모든 변경은 승인 후에만 적용됩니다.'),
      !config.apiKey && h('div', { className: 'mt-3' },
        h(Button, { variant: 'accent', onClick: () => setTab('settings') }, '모델 연결 설정하기'))),
    ...turns.map((turn, index) => {
      const isLastTurn = index === turns.length - 1;
      const hasAssistantContent = Boolean(turn.reasoning || turn.tools.length || turn.assistantText || turn.proposals.length);
      return h('div', { key: index, className: 'bui-turn flex flex-col gap-2.5' },
        turn.user && h('article', { className: 'bui-message', 'data-role': 'user' }, h(MessageMarkdown, { text: turn.user.text })),
        hasAssistantContent && h('article', { className: 'bui-message', 'data-role': 'assistant' },
          h(Section, { label: 'Copilot' },
            h('div', { className: 'flex flex-col gap-2.5' },
              turn.reasoning && h(ThinkingState, {
                text: turn.reasoning,
                working: state.status === 'running' && state.phase === 'reasoning' && isLastTurn,
              }),
              turn.tools.length > 0 && h(ToolChips, { tools: turn.tools, notes: turn.notes }),
              turn.assistantText && h(MessageMarkdown, { text: turn.assistantText }),
              ...turn.proposals.map(proposal => h(ApprovalCard, {
                key: proposal.change.id,
                proposal,
                previewing: activePreviewProposal?.change.id === proposal.change.id,
                onPreview: proposal.change.kind === 'file' ? undefined : () => {
                  setFocusedProposalId(proposal.change.id);
                  try { changes?.preview?.(proposal.change); } catch (error) { setFileError(String(error.message ?? error)); }
                },
                disabled: (proposal.change.kind === 'file' ? !files : !changes) || state.status === 'running',
                onReject: () => store.reject(proposal.change.id),
                onApprove: () => proposal.change.kind === 'file' ? store.applyFile(proposal.change.id, files, changes?.getContext()) : store.apply(proposal.change.id, changes),
              }))))));
    }));
  return h('section', { className: 'copilot', 'aria-label': 'AI chat' },
    h('style', null, chatStyle),
    h(ChatComposer, { tab, onTab: setTab, conversation,
      onNewSession: () => {
        if ((state.messages.length || state.draft || state.proposals.length) && !globalThis.confirm('새 대화를 시작할까요? 현재 대화·초안·승인 대기 내역은 삭제되며 복구할 수 없습니다. 실행 중인 요청은 중단됩니다. 연결 설정과 캔버스는 유지됩니다.')) return;
        store.newSession(); setFileError(''); setTab('chat');
      },
      activity: tab === 'chat' && h('div', { className: 'bui-activity-stack flex flex-col gap-2' },
        h(RunActivity, { state }),
        (fileError || state.error) && h('div', { role: 'alert', className: 'bui-error' }, fileError || state.error)),
      draft: state.draft, onDraft: store.setDraft, onSend: send, running: state.status === 'running', onCancel: () => store.cancel(),
      model: config.model, selection: selected.length, folderConnected: !!files, folderAvailable: !!globalThis.showDirectoryPicker,
      onFolder: async () => { try { setFiles(createWorkspaceFiles(await showDirectoryPicker({ mode: 'readwrite' }))); } catch (error) { if (error.name !== 'AbortError') setFileError(String(error.message)); } },
    }));
}
