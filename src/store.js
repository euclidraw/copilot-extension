const key = 'euclidraw.copilot.chat.v1';
export function createChatStore(storage = globalThis.localStorage) {
  let saved;
  try { saved = JSON.parse(storage?.getItem(key) ?? 'null'); } catch { /* Unavailable storage is not fatal. */ }
  let state = { messages: Array.isArray(saved?.messages) ? saved.messages.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').slice(-100) : [], draft: '', status: 'idle', error: null };
  const listeners = new Set();
  let controller;
  const publish = patch => {
    state = { ...state, ...patch };
    try { storage?.setItem(key, JSON.stringify({ messages: state.messages.slice(-100) })); } catch { /* Quota/private mode. */ }
    listeners.forEach(fn => fn());
  };
  return {
    getSnapshot: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setDraft: draft => publish({ draft }),
    cancel() { controller?.abort(); controller = undefined; if (state.status === 'running') publish({ status: 'cancelled' }); },
    async send(context, run) {
      if (state.status === 'running' || !state.draft.trim()) return;
      if (!run) { publish({ error: '모델 연결이 필요합니다. 아직 요청을 전송하지 않았습니다.' }); return; }
      const frozenContext = structuredClone(context);
      const text = state.draft.trim();
      const current = controller = new AbortController();
      publish({ draft: '', error: null, status: 'running', messages: [...state.messages, { role: 'user', text }, { role: 'assistant', text: '' }] });
      try {
        await run({ text, context: frozenContext, signal: current.signal, onText(delta) {
          if (controller !== current || current.signal.aborted) return;
          const messages = state.messages.slice();
          messages[messages.length - 1] = { role: 'assistant', text: messages.at(-1).text + delta };
          publish({ messages });
        } });
        if (controller === current && !current.signal.aborted) publish({ status: 'idle' });
      } catch (error) {
        if (controller === current && !current.signal.aborted) publish({ status: 'error', error: String(error.message ?? error) });
      } finally { if (controller === current) controller = undefined; }
    },
  };
}
