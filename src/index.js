import metadata from '../extension.json';
import { createPackageManifest } from './manifest.js';
import { ChatPanel } from './panel.js';
import { createChatStore } from './store.js';

export default {
  ...createPackageManifest(metadata), summary: metadata.summary, aspects: [],
  activate(context) {
    const mounts = context.services.get('ui.react-panels');
    if (!mounts) throw new Error('Copilot requires the ui.react-panels host service. Update the host.');
    // Optional host services must never take the whole chat panel down on an older host.
    const optional = id => { try { return context.services.get(id); } catch { return undefined; } };
    const store = createChatStore();
    const off = context.services.get('ui.workbench').register(metadata.id, { panels: [{
      panelId: 'euclidraw.copilot.chat', title: 'Copilot',
      icon: { size: 20, paths: [
        'M10 3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h1v3l4-3h3a3 3 0 0 0 3-3v-2',
        'M15 1.5 16.2 4.8 19.5 6 16.2 7.2 15 10.5 13.8 7.2 10.5 6 13.8 4.8Z',
        'M6.5 10.5h4',
      ] }, defaultZone: 'left',
      navigation: { group: 'document', order: 10 },
      mount(host, panelContext) {
        return mounts.mount(host, { panelId: 'euclidraw.copilot.chat', Component: ChatPanel, props: { store, panelContext, changes: context.services.get('workspace.changes'), tools: context.services.get('workspace.tools'), snapshot: optional('canvas.snapshot') } });
      },
    }] });
    return { dispose() { store.cancel(); off(); } };
  },
};
