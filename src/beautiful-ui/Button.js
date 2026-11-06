// Beautiful UI Button.tsx: original base/variant/sm classes, without cva/cn.
import { createElement as h } from 'react';
const variants = {
  ghost: 'bg-hover-2 text-ink hover:bg-line-strong',
  accent: 'bg-accent text-white hover:bg-accent-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
};
export function Button({ variant = 'ghost', className = '', ...props }) {
  return h('button', { type: 'button', ...props, className: `inline-flex items-center justify-center font-medium select-none transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none h-[27px] px-3 text-[13px] leading-none rounded-full gap-1.5 ${variants[variant]} ${className}` });
}
