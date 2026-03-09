// FIX: `__dirname` is not available in ES modules. Import `fileURLToPath` and `URL` from the 'url' module to construct the path.
import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            if (normalizedId.includes('html-to-image') || normalizedId.includes('html2canvas')) return 'capture';
            if (
              normalizedId.includes('/components/Legacy') ||
              normalizedId.includes('/views/LegacyRenderView') ||
              normalizedId.includes('/utils/legacyRenderPayload') ||
              normalizedId.includes('/scripts/legacy-render-worker')
            ) return 'legacy';
            if (
              normalizedId.includes('/constants/GMboard') ||
              normalizedId.includes('/constants/items') ||
              normalizedId.includes('/constants/nobility') ||
              normalizedId.includes('/constants/oracle') ||
              normalizedId.includes('/data/initialCodex')
            ) return 'game-data';
            if (
              normalizedId.includes('/contexts/GameContext') ||
              normalizedId.includes('/contexts/CodexBuilderContext') ||
              normalizedId.includes('/contexts/TutorialContext') ||
              normalizedId.includes('/contexts/gameDomains/') ||
              normalizedId.includes('/utils/coreLoopUtils') ||
              normalizedId.includes('/utils/progressUtils') ||
              normalizedId.includes('/utils/reportAtlasUtils') ||
              normalizedId.includes('/utils/taskDomain') ||
              normalizedId.includes('/utils/taskMutationUtils') ||
              normalizedId.includes('/services/SupabaseService') ||
              normalizedId.includes('/services/SimpleRateLimiter')
            ) return 'game-core';
            if (
              normalizedId.includes('/node_modules/@ai-sdk/') ||
              normalizedId.includes('/node_modules/ai/')
            ) return 'oracle-ai';
            if (normalizedId.includes('/node_modules/react-easy-crop/')) return 'cropper';

            if (id.includes('node_modules')) {
              if (id.includes('@supabase') || id.includes('supabase')) return 'supabase';
              if (id.includes('recharts') || id.includes('d3-') || id.includes('chart')) return 'charts';
              // More specific check for core react libraries to avoid catching react-easy-crop, etc.
              if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/')) return 'react';
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // FIX: Expose Supabase environment variables through process.env to align with project standards and fix type errors in supabaseClient.ts.
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        // FIX: Replaced `path.resolve(__dirname, '.')` with an ESM-compatible equivalent to get the project root directory.
        '@': fileURLToPath(new URL('.', import.meta.url)),
      }
    }
  };
});
