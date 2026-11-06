// Adapted from official ApprovalCard.tsx. Retains card, heading, footer and
// Button primitives. Replaces the demo questionnaire with an immutable plan;
// never auto-advances, auto-approves, or reports success before host confirmation.
import { createElement as h } from 'react';
import { Button } from './Button.js';

export function ApprovalCard({ proposal, disabled, onApprove, onReject }) {
  const { change, status } = proposal;
  const file = change.kind === 'file';
  return h('section', { className: 'bui-approval w-full', 'aria-label': '변경 승인', 'data-beautiful-ui': 'approval-card' },
    h('div', { className: 'relative overflow-hidden rounded-card bg-surface shadow-card' },
      h('div', { className: 'primitive-card-pad' },
        h('h3', { className: 'text-[14px] font-medium text-ink' }, file ? '파일 변경을 승인할까요?' : '캔버스 변경을 승인할까요?'),
        h('p', { className: 'mt-2.5 text-[12px] text-ink-2' }, file ? '외부 편집과 원자적 비교 불가 · 파일 Undo 제외' : '내역 확인 후 적용 · 충돌 검사 · 단일 Undo'),
        h('details', { className: 'mt-2.5' },
          h('summary', { className: 'cursor-pointer text-[12px] text-ink-2' }, file ? change.path : `변경 내역 ${change.operations.length}개 보기`),
          h('pre', { className: 'bui-plan-code' }, JSON.stringify(file ? { path: change.path, text: change.text } : change.operations, null, 2)))),
      h('div', { className: 'primitive-card-footer flex items-center justify-between gap-3' },
        h('span', { className: `text-[12px] font-medium ${status === 'applied' ? 'text-green' : 'text-ink-2'}`, role: 'status' }, { pending: '승인 대기', applied: '적용됨', rejected: '거절됨', applying: '적용 중', failed: '실패' }[status] ?? status),
        status === 'pending' && h('div', { className: 'flex items-center gap-1.5' },
          h(Button, { disabled, onClick: onReject }, '거절'),
          h(Button, { variant: 'accent', disabled, onClick: onApprove }, '승인 및 적용')))));
}
