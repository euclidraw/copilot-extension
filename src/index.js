import metadata from '../extension.json';
import { createPackageManifest } from './manifest.js';
import { ChatPanel } from './panel.js';
import { createChatStore } from './store.js';

export default {
  ...createPackageManifest(metadata), summary: metadata.summary, aspects: [],
  activate(context) {
    const mounts = context.services.get('ui.react-panels');
    if (!mounts) throw new Error('Copilot requires the ui.react-panels host service. Update the host.');
    const store = createChatStore();
    const off = context.services.get('ui.workbench').register(metadata.id, { panels: [{
      panelId: 'euclidraw.copilot.chat', title: 'Copilot', icon: 'chat', defaultZone: 'left',
      navigation: { group: 'document', order: 10 },
      mount(host, panelContext) {
        return mounts.mount(host, { panelId: 'euclidraw.copilot.chat', Component: ChatPanel, props: { store, panelContext, changes: context.services.get('workspace.changes'), tools: context.services.get('workspace.tools') } });
      },
    }] });
    return { dispose() { store.cancel(); off(); } };
  },
};
