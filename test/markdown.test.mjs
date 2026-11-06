import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MessageMarkdown } from '../src/markdown.js';

const render = text => renderToStaticMarkup(createElement(MessageMarkdown, { text }));
test('renders headings, lists, fenced code and GFM tables', () => {
  const html = render('# 제목\n\n**강조**\n\n- 항목\n\n```js\nconst x = 1;\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |');
  for (const tag of ['h1', 'strong', 'ul', 'pre', 'table']) assert.match(html, new RegExp(`<${tag}[ >]`));
  assert.match(html, /language-js/);
});
test('renders inline and block LaTeX as native MathML without external assets', () => {
  const html = render('인라인 $x^2$\n\n$$\n\\frac{a}{b} = \\sqrt{c}\n$$');
  assert.match(html, /<math/); assert.match(html, /<msup/); assert.match(html, /<mfrac/); assert.match(html, /<msqrt/);
  assert.match(html, /display="block"/); assert.doesNotMatch(html, /<link|<img|<script/);
});
test('untrusted HTML, unsafe links and tracking images cannot execute or fetch', () => {
  const html = render('<script>alert(1)</script>\n\n[x](javascript:alert%281%29)\n\n![tracking](https://evil.example/pixel)\n\n$\\href{javascript:alert(1)}{x}$');
  assert.doesNotMatch(html, /<script|<img|href="javascript:|src="https:/);
  assert.match(html, /noopener noreferrer/);
});
test('incomplete streamed markup and invalid formulas remain renderable', () => {
  for (const text of ['**partial', '```js\nconst', '$x^', '$$\n\\frac{', '$\\unknowncommand{x}$']) assert.doesNotThrow(() => render(text));
});
