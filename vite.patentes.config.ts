import { mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import base from './vite.preview.config';

// Only this standalone bench substitutes the background renderer. App builds are unchanged.
export default mergeConfig(base, {
  server: { host: '127.0.0.1', port: 3016, strictPort: true },
  plugins: [{
    name: 'patentes-preview-background', enforce: 'pre',
    resolveId(source, importer) {
      if (source === './ProfileBackgroundSurface' && importer?.replaceAll('\\', '/').endsWith('/components/NobilityLadder.tsx')) {
        return fileURLToPath(new URL('./tools/patentes-surface.tsx', import.meta.url));
      }
    },
  }],
});
