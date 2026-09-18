import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';

// Independent build: no main app CSS, vendor chunks, environment or backend.
export default defineConfig(({mode}) => ({
  root: fileURLToPath(new URL('./zen3d-test', import.meta.url)),
  base: mode === 'embedded' ? './' : '/zen3d-test/',
  plugins: [react(),{
    name:'garden-approved-assets',
    generateBundle(){
      const dir=fileURLToPath(new URL('./tools/zen-quality/assets/light/',import.meta.url));
      for(const file of readdirSync(dir))if(/\.(gltf|bin|webp)$/.test(file))this.emitFile({type:'asset',fileName:`assets/light/${file}`,source:readFileSync(`${dir}/${file}`)});
    },
  }],
  server: { host: '0.0.0.0', port: 3017 },
  build: {
    outDir: fileURLToPath(new URL(mode === 'embedded' ? './public/garden3d' : './dist/zen3d-test', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three';
        },
      },
    },
  },
}));
