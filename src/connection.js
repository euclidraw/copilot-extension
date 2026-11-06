// Stable across extension releases; never include the package version here.
const key = 'euclidraw.copilot.connection.v1';
export const defaultConnection = { endpoint: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', apiKey: '' };
const normalize = value => Object.fromEntries(Object.entries(defaultConnection).map(([field, fallback]) => [field, typeof value?.[field] === 'string' ? value[field] : fallback]));

export function loadConnection(storage) {
  try { return normalize(JSON.parse((storage ?? globalThis.localStorage)?.getItem(key) ?? 'null')); }
  catch { return { ...defaultConnection }; }
}

export function saveConnection(value, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    target.setItem(key, JSON.stringify(normalize(value)));
    return true;
  } catch { return false; }
}

export function clearConnection(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    target.removeItem(key);
    return true;
  } catch { return false; }
}
