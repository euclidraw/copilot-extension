// Adapted from Beautiful UI ToolChips.tsx (MIT, copyright 2026 Shane Levine).
// Replaces scripted demo timers/portals with real agent tool calls and step notes.
import { createElement as h, useState } from 'react';

const TOOL_LABELS = {
  context_get: ['read', '선택 문맥 확인'],
  entities_read: ['read', '선택 엔티티 읽기'],
  entity_types_list: ['read', '스키마 메타데이터 확인'],
  entity_descriptors: ['read', '도메인 설명 확인'],
  tools_search: ['run', '확장 도구 검색'],
  tool_describe: ['read', '도구 계약 확인'],
  tool_invoke: ['run', '확장 도구 실행'],
  changes_propose: ['write', '변경안 생성'],
  files_list: ['read', '파일 목록 조회'],
  file_read: ['read', '파일 읽기'],
  file_write: ['write', '파일 쓰기 제안'],
  file_patch: ['write', '파일 패치 제안'],
};

const STATUS_LABELS = {
  running: '실행 중',
  completed: '완료',
  failed: '실패',
};

function ToolIcon({ kind }) {
  if (kind === 'write') {
    return h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('path', { d: 'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z' }));
  }
  if (kind === 'run') {
    return h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('path', { d: 'M4 17l6-5-6-5M12 19h8' }));
  }
  return h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
    h('path', { d: 'M14 2v6h6' }));
}

export function ToolChips({ tools = [], notes = [] }) {
  const active = tools.some(tool => tool.status === 'running' || tool.status === 'failed');
  const [manualOpen, setManualOpen] = useState(null);
  const open = manualOpen ?? active;
  const runningCount = tools.filter(tool => tool.status === 'running').length;
  const failedCount = tools.filter(tool => tool.status === 'failed').length;
  const header = runningCount
    ? `도구 실행 중 (${tools.length - runningCount}/${tools.length})`
    : failedCount
      ? `도구 ${tools.length}개 중 ${failedCount}개 실패`
      : `도구 ${tools.length}개 실행됨`;

  return h('div', { className: 'bui-tool-list w-full', 'aria-label': '도구 실행 기록', 'data-beautiful-ui': 'tool-chips' },
    h('button', {
      type: 'button',
      'aria-expanded': open,
      onClick: () => setManualOpen(!open),
      className: '-mx-1.5 flex w-fit items-center gap-1.5 rounded-control px-1.5 py-1 text-[12.5px] text-ink-2 transition-colors duration-100 hover:bg-hover-2',
    },
      h('svg', {
        width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round',
        className: 'transition-transform duration-200',
        style: { transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' },
        'aria-hidden': true,
      }, h('path', { d: 'M6 9l6 6 6-6' })),
      h('span', { className: 'tabular-nums' }, header)),
    h('div', { hidden: !open, className: 'mt-1 flex flex-col gap-1 pl-2 border-l border-line ml-1' },
      ...notes.map((note, idx) => h('p', { key: `note-${idx}`, className: 'm-0 px-1.5 py-0.5 text-[12px] leading-relaxed text-ink-2' }, note)),
      ...tools.map(tool => {
        const [icon, label] = TOOL_LABELS[tool.name] ?? ['run', '도구 실행'];
        const statusText = STATUS_LABELS[tool.status] ?? tool.status;
        return h('div', {
          key: tool.id,
          className: 'bui-tool flex min-h-7 w-full min-w-0 items-center gap-2 rounded-control px-1.5 py-0.5 text-left',
          'data-status': tool.status,
        },
          h('span', { className: 'flex size-4 shrink-0 items-center justify-center text-ink-3' }, h(ToolIcon, { kind: icon })),
          h('span', { className: 'shrink-0 text-[12.5px] font-medium text-ink' }, label),
          h('span', {
            className: `inline-flex h-5.5 min-w-0 flex-1 items-center truncate rounded-chip bg-field px-1.5 font-mono text-[11.5px] shadow-hairline ${tool.status === 'failed' ? 'text-red' : 'text-ink-2'}`,
          }, `${tool.name} · ${statusText}`));
      })));
}
