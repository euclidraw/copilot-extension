import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCanvasContext } from '../src/canvas-context.js';

function fixture(count, text = '') {
  const snapshot = Object.fromEntries(Array.from({ length: count }, (_, i) => [`p${i}`, { 'test.note': { text } }]));
  return { exportCanonicalSnapshot: () => structuredClone(snapshot), isAlive: id => Object.hasOwn(snapshot, id), getCanonicalSchema: () => ({ id: 'test.note' }) };
}
test('small documents include every live entity while keeping selection distinct', () => {
  const context = buildCanvasContext(fixture(100), ['p1'], 'doc', 'main');
  assert.equal(context.scope, 'document');
  assert.equal(context.entities.length, 100);
  assert.deepEqual(context.selectedIds, ['p1']);
  assert.equal(context.truncated, false);
});
test('entity count or serialized context budget falls back to selection', () => {
  for (const world of [fixture(101), fixture(2, 'a'.repeat(26000))]) {
    const context = buildCanvasContext(world, ['p0'], 'doc', 'main');
    assert.equal(context.scope, 'selection');
    assert.deepEqual(context.entities.map(e => e.id), ['p0']);
    assert.equal(context.truncated, true);
  }
});
test('empty selection still reads small documents but not large documents', () => {
  assert.equal(buildCanvasContext(fixture(3), [], 'doc', 'main').entities.length, 3);
  assert.equal(buildCanvasContext(fixture(101), [], 'doc', 'main').entities.length, 0);
});
test('hidden canonical objects and scratch-only ghosts are never included', () => {
  const world = fixture(2);
  world.isAlive = id => id !== 'p1';
  const context = buildCanvasContext(world, ['p1', 'ghost'], 'doc', 'main');
  assert.deepEqual(context.entities.map(e => e.id), ['p0']);
  assert.equal(context.totalEntities, 1);
  assert.equal(context.truncated, false);
});
