// Beautiful UI ChatComposer.tsx Section, adapted only for real content,
// semantic disclosure and reduced-motion support. MIT, Shane Levine (2026).
import { createElement as h } from 'react';

export function Section({ label, sub, time, children, resolving = false }) {
  return h('div', { className: 'bui-section flex w-full flex-col gap-1.5 transition-[opacity,transform] duration-400', 'data-resolving': resolving },
    h('div', { className: 'flex items-center gap-1 text-[12px] leading-[1.3]' },
      h('span', { className: 'font-medium text-ink' }, label),
      sub && h('span', { className: 'text-ink-2' }, sub),
      time && h('span', { className: 'text-ink' }, time)),
    h('div', { className: 'text-[13px] leading-normal text-ink' }, children));
}
