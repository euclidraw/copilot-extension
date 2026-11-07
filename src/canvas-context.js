export const WHOLE_DOCUMENT_ENTITY_LIMIT = 100;
export const WHOLE_DOCUMENT_CONTEXT_LIMIT = 48 * 1024;

/** Freeze canonical data at send time; previews and cascade-hidden objects stay out. */
export function buildCanvasContext(world, selection, documentId, viewId) {
  const selectedIds = [...selection].slice(0, 100);
  const snapshot = world.exportCanonicalSnapshot();
  const ids = Object.keys(snapshot).filter(id => world.isAlive(id));
  const build = (includedIds, scope) => {
    const entities = includedIds.filter(id => snapshot[id] && world.isAlive(id))
      .map(id => ({ id, aspects: snapshot[id], source: 'canonical' }));
    const schemas = Object.fromEntries([...new Set(entities.flatMap(entity => Object.keys(entity.aspects)))].map(aspect =>
      [aspect, { metadata: world.getCanonicalSchema(aspect), semanticDescriptor: null }]));
    return { documentId, viewId, selectedIds, entities, schemas, scope,
      totalEntities: ids.length, truncated: entities.length < ids.length };
  };
  if (ids.length <= WHOLE_DOCUMENT_ENTITY_LIMIT) {
    const whole = build(ids, 'document');
    if (JSON.stringify(whole).length <= WHOLE_DOCUMENT_CONTEXT_LIMIT) return whole;
  }
  return build(selectedIds, 'selection');
}
