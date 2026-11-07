// Stable across extension releases; never include the package version here.
const key = 'euclidraw.copilot.connection.v1';
export const defaultConnection = { endpoint: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', apiKey: '', maxTokens: '32768' };
export const MAX_OUTPUT_TOKENS = 200000;
/** Long outputs stream slowly; allow 10 minutes while still bounding runaway workers. */
export const EXECUTION_BUDGET_MS = 600000;
/** Positive integer output budget; invalid or empty input falls back to the default. */
export function outputTokens(value) {
  const number = Number(String(value ?? '').trim());
  return Number.isInteger(number) && number >= 256 ? Math.min(number, MAX_OUTPUT_TOKENS) : Number(defaultConnection.maxTokens);
}
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
