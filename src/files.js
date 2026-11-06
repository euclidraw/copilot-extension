const limit = 256 * 1024;
export function validatePath(path) {
  if (typeof path !== 'string' || !path || path.length > 1024 || /[\\\u0000-\u001f]/.test(path)) throw Error('INVALID_INPUT: path');
  const parts = path.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || part.startsWith('.'))) throw Error('PERMISSION_DENIED: path');
  return parts;
}
async function revision(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Directory handles cannot traverse parents; symlink access is restricted by the browser.
 * CAS is best-effort, NOT atomic against external editors. Writes always need UI approval.
 */
export function createWorkspaceFiles(root) {
  let queue = Promise.resolve();
  const reads = new Map();
  const check = signal => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  async function handle(path, create = false) {
    const parts = validatePath(path);
    let directory = root;
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part);
    return directory.getFileHandle(parts.at(-1), { create });
  }
  async function read(path, signal) {
    check(signal);
    const file = await (await handle(path)).getFile();
    if (file.size > limit) throw Error('INVALID_INPUT: file size budget');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.includes(0)) throw Error('INVALID_INPUT: binary file');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const hash = await revision(text); check(signal);
    reads.set(path, hash);
    return { source: path, text, revision: hash, truncated: false, atomicCompareAndSwap: false };
  }
  return {
    read,
    async list(signal) {
      const paths = []; let truncated = false;
      async function visit(directory, prefix, depth) {
        if (depth > 8) { truncated = true; return; }
        for await (const [name, entry] of directory.entries()) {
          check(signal);
          if (name.startsWith('.')) continue;
          if (paths.length >= 200) { truncated = true; return; }
          const path = prefix + name;
          if (entry.kind === 'file') paths.push(path);
          else await visit(entry, `${path}/`, depth + 1);
        }
      }
      await visit(root, '', 0);
      return { source: root.name, paths: paths.sort(), truncated, atomicCompareAndSwap: false };
    },
    propose(input) {
      validatePath(input.path);
      if (/\.ecanvas\.jsonl$/i.test(input.path)) throw Error('PERMISSION_DENIED: use canvas change tools');
      if (typeof input.text !== 'string' || new TextEncoder().encode(input.text).length > limit) throw Error('INVALID_INPUT: text budget');
      if (input.expectedRevision !== null && reads.get(input.path) !== input.expectedRevision) throw Error('PERMISSION_DENIED: read this revision first');
      return { id: crypto.randomUUID(), path: input.path, text: input.text, expectedRevision: input.expectedRevision, atomicCompareAndSwap: false };
    },
    async patch(input, signal) {
      if (typeof input.search !== 'string' || !input.search || typeof input.replacement !== 'string') throw Error('INVALID_INPUT: patch');
      const current = await read(input.path, signal);
      if (current.revision !== input.expectedRevision) throw Error('CONFLICT: file changed');
      const index = current.text.indexOf(input.search);
      if (index < 0 || current.text.indexOf(input.search, index + 1) >= 0) throw Error('INVALID_INPUT: patch must match exactly once');
      return this.propose({ path: input.path, expectedRevision: input.expectedRevision, text: current.text.slice(0, index) + input.replacement + current.text.slice(index + input.search.length) });
    },
    apply(proposal, signal) {
      const operation = queue.then(async () => {
        check(signal);
        const verified = this.propose(proposal);
        let current;
        try { current = await read(verified.path, signal); }
        catch (error) { if (error.name !== 'NotFoundError') throw error; }
        if ((current?.revision ?? null) !== verified.expectedRevision) throw Error('CONFLICT: file changed');
        check(signal);
        const file = await handle(verified.path, true);
        const writable = await file.createWritable();
        try { await writable.write(verified.text); check(signal); await writable.close(); }
        catch (error) { await writable.abort().catch(() => {}); throw error; }
        return { source: verified.path, revision: await revision(verified.text), atomicCompareAndSwap: false, previousText: current?.text ?? null, undo: 'manual; restore only after checking current content' };
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
