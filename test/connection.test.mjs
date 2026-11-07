import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConnection, saveConnection, clearConnection, defaultConnection, outputTokens, MAX_OUTPUT_TOKENS, EXECUTION_BUDGET_MS } from '../src/connection.js';

test('output budget defaults large, accepts user values and rejects invalid input', () => {
  assert.equal(outputTokens(defaultConnection.maxTokens), 32768);
  assert.equal(outputTokens('100000'), 100000);
  assert.equal(outputTokens(String(MAX_OUTPUT_TOKENS * 10)), MAX_OUTPUT_TOKENS);
  for (const bad of ['', 'abc', '12.5', '-1', '100']) assert.equal(outputTokens(bad), 32768);
  assert.equal(EXECUTION_BUDGET_MS, 600000);
});

const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};

test('connection survives module reloads during extension updates and can be cleared', async () => {
  const storage = memory();
  const config = { endpoint: 'https://model.example/v1', model: 'custom', apiKey: 'fake-test-only', maxTokens: '100000' };
  assert.equal(saveConnection(config, storage), true);
  const updated = await import('../src/connection.js?updated-release');
  assert.deepEqual(updated.loadConnection(storage), config);
  // Settings saved before maxTokens existed keep their key and gain the new default.
  storage.setItem('euclidraw.copilot.connection.v1', JSON.stringify({ endpoint: 'https://old.example/v1', model: 'old', apiKey: 'kept' }));
  assert.deepEqual(updated.loadConnection(storage), { endpoint: 'https://old.example/v1', model: 'old', apiKey: 'kept', maxTokens: '32768' });
  assert.equal(updated.clearConnection(storage), true);
  assert.deepEqual(loadConnection(storage), defaultConnection);
});

test('invalid saved data falls back to defaults and only known string fields persist', () => {
  const storage = memory();
  storage.getItem = () => '{broken';
  assert.deepEqual(loadConnection(storage), defaultConnection);
  storage.getItem = () => '{"model":42,"apiKey":null,"endpoint":"https://example.com"}';
  assert.deepEqual(loadConnection(storage), { ...defaultConnection, endpoint: 'https://example.com' });
  const clean = memory();
  saveConnection({ ...defaultConnection, unexpected: 'not saved' }, clean);
  assert.deepEqual(loadConnection(clean), defaultConnection);
});

test('blocked storage never crashes and reports write and clear failures', () => {
  const storage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('blocked'); } };
  assert.deepEqual(loadConnection(storage), defaultConnection);
  assert.equal(saveConnection(defaultConnection, storage), false);
  assert.equal(clearConnection(storage), false);
});
