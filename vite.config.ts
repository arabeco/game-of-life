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
