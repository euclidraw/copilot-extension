// Official ThinkingState.tsx Reasoning variant, controlled by real provider
// events instead of useSequence(STAGES). Original header, chevron and trace
// structure retained; no demo text, simulated timing or fixed minimum height.
import { createElement as h, useId, useState } from 'react';
export function ThinkingState({ text, working = false }) {
  const [expanded, setExpanded] = useState(false), id = useId();
  return h('div', { className: 'bui-thinking flex w-full flex-col', 'data-beautiful-ui': 'thinking-state' },
    h('button', { type: 'button', 'aria-expanded': expanded, 'aria-controls': id, onClick: () => setExpanded(!expanded), className: '-mx-1.5 flex w-fit items-center gap-2 rounded-control px-1.5 py-1 transition-colors duration-100 hover:bg-hover-2' },
      h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: working ? 'var(--ink-2)' : 'var(--ink-3)', 'aria-hidden': true }, h('path', { d: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z' })),
      h('span', { className: `text-[13px] font-medium whitespace-nowrap text-ink-2 ${working ? 'bui-thinking-shimmer' : ''}` }, working ? '모델 추론 수신 중' : '모델 추론'),
      h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'var(--ink-3)', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'transition-transform duration-300', style: { transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }, 'aria-hidden': true }, h('path', { d: 'M6 9l6 6 6-6' }))),
    h('div', { id, hidden: !expanded },
      h('div', { className: 'relative mt-1 ml-[5px] pl-4' },
        h('span', { className: 'absolute left-[3px] w-px bg-line', style: { top: 0, bottom: 0 }, 'aria-hidden': true }),
        h('div', { className: 'flex flex-col gap-1 py-1' }, h('div', { className: 'flex min-h-7 w-full items-center gap-2 rounded-[6px] px-1.5 py-0.5 text-left' },
          h('div', { className: 'bui-thinking-body min-w-0 text-[12.5px] whitespace-normal leading-relaxed text-ink-2' }, text))))));
}
