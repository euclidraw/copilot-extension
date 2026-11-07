import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('built browser worker runs Pi tool loop and streams via a fake OpenAI endpoint', { timeout: 10000 }, async () => {
  const bundle = await readFile(new URL('../dist/plugin.js', import.meta.url), 'utf8');
  // Match one complete JS string literal, including escaped quotes, rather
  // than the rest of the minified line (which contains other declarations).
  const match = bundle.match(/(?:var|const)\s+\w+\s*=\s*("\(function\((?:\\.|[^"\\])*")/);
  assert.ok(match, 'inline worker source must be embedded, not a relative asset');
  const source = runInNewContext(match[1]);
  const events = [], requests = [];
  let complete, fail;
  const done = new Promise((resolve, reject) => { complete = resolve; fail = reject; });
  const self = { postMessage(event) {
    events.push(event);
    if (event.type === 'tool') queueMicrotask(() => self.onmessage({ data: { type: 'tool-result', id: event.id, result: { selectedIds: ['a'] } } }));
    if (event.type === 'done') complete();
    if (event.type === 'error') fail(Error(event.error));
  } };
  const fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    const delta = requests.length === 1
      ? { tool_calls: [{ index: 0, id: 'call_context', type: 'function', function: { name: 'context_get', arguments: '{}' } }] }
      : { content: 'Selected entity a.' };
    const chunks = [
      { id: 'fake', choices: [{ index: 0, delta, finish_reason: null }] },
      { id: 'fake', choices: [{ index: 0, delta: {}, finish_reason: requests.length === 1 ? 'tool_calls' : 'stop' }] },
    ];
    return new Response(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
  };
  runInNewContext(source, { self, fetch, console, TextEncoder, TextDecoder, AbortController, AbortSignal,
    URL, URLSearchParams, FormData, Blob, File, Headers, Request, Response, ReadableStream, TransformStream, crypto, setTimeout, clearTimeout, queueMicrotask,
    structuredClone, performance, navigator: { userAgent: 'worker-test' } });
  await self.onmessage({ data: { type: 'start', text: 'Read selection', history: [{ role: 'user', text: 'Earlier request' }], config: { endpoint: 'https://fake.example/v1', model: 'fake-model', apiKey: 'fake-test-only', maxTokens: 65536 } } });
  await done;
  assert.equal(requests.length, 2);
  assert.equal(requests[0].max_completion_tokens ?? requests[0].max_tokens, 65536, 'configured output budget reaches the provider request');
  assert.ok(requests[0].messages.some(message => message.content === 'Earlier request'));
  assert.ok(requests[1].messages.some(message => message.role === 'tool' && message.content.includes('selectedIds')), JSON.stringify(requests[1].messages));
  assert.equal(events.filter(event => event.type === 'text').map(event => event.text).join(''), 'Selected entity a.');
});
