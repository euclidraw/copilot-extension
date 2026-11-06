import { createElement as h } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const remarkPlugins = [remarkGfm, remarkMath];
// Native MathML avoids external font/asset URLs in the single Blob ESM bundle.
// Raw Markdown HTML is never parsed; KaTeX trusted commands remain disabled.
const rehypePlugins = [[rehypeKatex, { output: 'mathml', trust: false, strict: 'warn', throwOnError: false, maxExpand: 1000, maxSize: 20 }]];
export function MessageMarkdown({ text }) {
  return h('div', { className: 'bui-markdown' }, h(Markdown, {
    remarkPlugins, rehypePlugins, skipHtml: true,
    components: {
      a: ({ href, children }) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, children),
      // Remote images can leak conversation data through tracking URLs. Render
      // alt text only; attachments need a separately approved retrieval path.
      img: ({ alt }) => h('span', { className: 'bui-image-alt' }, alt ? `[이미지: ${alt}]` : '[이미지]'),
    },
  }, text));
}
