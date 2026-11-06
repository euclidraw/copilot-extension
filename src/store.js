const key = 'euclidraw.copilot.chat.v1';
export function createChatStore(storage = globalThis.localStorage) {
  let saved;
  try { saved = JSON.parse(storage?.getItem(key) ?? 'null'); } catch { /* Unavailable storage is not fatal. */ }
  let state = { messages: Array.isArray(saved?.messages) ? saved.messages.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').slice(-100) : [], proposals: [], draft: '', status: 'idle', error: null };
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
    apply(id, changes) {
      const proposal = state.proposals.find(item => item.change.id === id);
      if (!proposal || proposal.status !== 'pending' || state.status === 'running') return;
      try {
        const result = changes.apply(proposal.change);
        publish({ proposals: state.proposals.map(item => item === proposal ? { ...item, status: 'applied', result } : item), error: null });
      } catch (error) { publish({ error: String(error.message ?? error) }); }
    },
    async applyFile(id, files, context) {
      const proposal = state.proposals.find(item => item.change.id === id);
      if (!proposal || proposal.status !== 'pending' || state.status === 'running') return;
      if (!context || context.signal.aborted || proposal.change.documentId !== context.documentId) { publish({ error: 'CONFLICT: document is no longer active' }); return; }
      publish({ proposals: state.proposals.map(item => item === proposal ? { ...item, status: 'applying' } : item) });
      try {
        const result = await files.apply(proposal.change, context.signal);
        publish({ proposals: state.proposals.map(item => item.change.id === id ? { ...item, status: 'applied', result } : item), error: null });
      } catch (error) { publish({ proposals: state.proposals.map(item => item.change.id === id ? { ...item, status: 'failed' } : item), error: String(error.message ?? error) }); }
    },
    cancel() { controller?.abort(); controller = undefined; if (state.status === 'running') publish({ status: 'cancelled' }); },
    async send(context, run, lifetimeSignal) {
      if (state.status === 'running' || !state.draft.trim()) return;
      if (!run) { publish({ error: '모델 연결이 필요합니다. 아직 요청을 전송하지 않았습니다.' }); return; }
      const frozenContext = structuredClone(context);
      const text = state.draft.trim();
      const history = state.messages.filter(message => message.documentId === context.documentId && message.text).slice(-20).map(({ role, text }) => ({ role, text: text.slice(0, 8000) }));
      const current = controller = new AbortController();
      const revoke = () => { current.abort(); if (controller === current) { controller = undefined; publish({ status: 'cancelled', proposals: state.proposals.filter(item => item.change.documentId !== context.documentId) }); } };
      lifetimeSignal?.addEventListener('abort', revoke, { once: true });
      if (lifetimeSignal?.aborted) { revoke(); return; }
      publish({ draft: '', error: null, status: 'running', messages: [...state.messages, { role: 'user', text, documentId: context.documentId }, { role: 'assistant', text: '', documentId: context.documentId }] });
      try {
        await run({ text, history, context: frozenContext, signal: current.signal, onProposal(change) {
          if (controller !== current || current.signal.aborted) return;
          publish({ proposals: [...state.proposals, { change, status: 'pending' }] });
        }, onText(delta) {
          if (controller !== current || current.signal.aborted) return;
          const messages = state.messages.slice();
          messages[messages.length - 1] = { role: 'assistant', text: messages.at(-1).text + delta, documentId: context.documentId };
          publish({ messages });
        } });
        if (controller === current && !current.signal.aborted) publish({ status: 'idle' });
      } catch (error) {
        if (controller === current && !current.signal.aborted) publish({ status: 'error', error: String(error.message ?? error) });
      } finally { lifetimeSignal?.removeEventListener('abort', revoke); if (controller === current) controller = undefined; }
    },
  };
}
