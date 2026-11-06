import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConnection, saveConnection, clearConnection, defaultConnection } from '../src/connection.js';

const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};

test('connection survives module reloads during extension updates and can be cleared', async () => {
  const storage = memory();
  const config = { endpoint: 'https://model.example/v1', model: 'custom', apiKey: 'fake-test-only' };
  assert.equal(saveConnection(config, storage), true);
  const updated = await import('../src/connection.js?updated-release');
  assert.deepEqual(updated.loadConnection(storage), config);
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
