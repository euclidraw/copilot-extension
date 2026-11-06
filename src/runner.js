import workerSource from './agent-worker.js?worker&inline';

/** A per-request worker is terminated on cancellation; it is not a trust sandbox. */
export function createRunner(config, files) {
  return ({ text, context, signal, onText, onProposal }) => new Promise((resolve, reject) => {
    const url = new URL(config.endpoint);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw Error('Use HTTPS or a loopback endpoint');
    if (JSON.stringify(context).length > 65536) throw Error('Selection exceeds context budget. Select fewer entities.');
    const worker = new workerSource();
    const timer = setTimeout(() => finish(Error('Agent execution budget exceeded')), 120000);
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    function finish(error) {
      clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate();
      error ? reject(error) : resolve();
    }
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) return abort();
    worker.onerror = event => finish(Error(event.message));
    worker.onmessage = async ({ data }) => {
      if (signal.aborted) return;
      if (data.type === 'text') onText(data.text);
      if (data.type === 'done') finish();
      if (data.type === 'error') finish(Error(data.error));
      if (data.type === 'tool') {
        try {
          let result;
          if (data.name === 'context_get') result = { source: 'selection-at-send', selectedIds: context.selectedIds, truncated: false };
          else if (data.name === 'entities_read') result = context.entities;
          else if (data.name === 'entity_types_list') result = context.schemas;
          else if (data.name === 'files_list' && files) result = await files.list(signal);
          else if (data.name === 'file_read' && files) result = await files.read(data.args.path, signal);
          else if (data.name === 'file_write' && files) {
            const proposal = files.propose(data.args);
            onProposal({ ...proposal, kind: 'file' });
            result = { proposalId: proposal.id, status: 'awaiting-user-approval', atomicCompareAndSwap: false };
          }
          else if (data.name === 'file_patch' && files) {
            const proposal = await files.patch(data.args, signal);
            if (!signal.aborted) onProposal({ ...proposal, kind: 'file' });
            result = { proposalId: proposal.id, status: 'awaiting-user-approval', atomicCompareAndSwap: false };
          }
          else if (data.name === 'changes_propose') {
            if (!Array.isArray(data.args?.operations) || !data.args.operations.length || data.args.operations.length > 100) throw Error('INVALID_INPUT');
            const expected = Object.fromEntries(context.entities.map(entity => [entity.id, entity.aspects]));
            if (data.args.operations.some(op => !Object.hasOwn(expected, op.id))) throw Error('PERMISSION_DENIED: selected targets only');
            const proposal = { id: crypto.randomUUID(), expected, operations: data.args.operations };
            onProposal(proposal);
            result = { proposalId: proposal.id, status: 'awaiting-user-approval' };
          }
          else throw Error('PERMISSION_DENIED');
          if (JSON.stringify(result).length > 65536) throw Error('Output budget exceeded');
          if (!signal.aborted) worker.postMessage({ type: 'tool-result', id: data.id, result });
        } catch (error) { worker.postMessage({ type: 'tool-result', id: data.id, error: String(error.message) }); }
      }
    };
    worker.postMessage({ type: 'start', text, config, filesEnabled: !!files });
  });
}
