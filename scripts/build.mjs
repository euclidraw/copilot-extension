import { build } from 'vite';
import { readConfig, writeInstallManifest } from './install-manifest.mjs';
import { buildBeautifulUI } from './build-beautiful-ui.mjs';

await readConfig();
await buildBeautifulUI();
await build();
const manifest = await writeInstallManifest();
console.log(`Prepared ${manifest.id} ${manifest.version}: ${manifest.sha256}`);
