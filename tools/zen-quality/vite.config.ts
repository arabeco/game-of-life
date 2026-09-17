import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  base: './',
  plugins: [{
    name: 'garden-shared-assets',
    generateBundle() {
      const dir = fileURLToPath(new URL('./assets/light/', import.meta.url));
      for (const file of readdirSync(dir)) {
        if (/\.(gltf|bin|webp)$/.test(file)) this.emitFile({ type: 'asset', fileName: `assets/light/${file}`, source: readFileSync(`${dir}/${file}`) });
      }
    },
  }],
  server: { host: '127.0.0.1', port: 3018, strictPort: true, fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } },
  build: { outDir: mode === 'embedded' ? '../../public/garden-experiment' : '../../dist/zen-quality', emptyOutDir: true, assetsInlineLimit: 0 },
}));
