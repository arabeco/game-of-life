import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * O servidor da bancada, separado do app.
 *
 * A pagina de prova monta os componentes DE VERDADE — CanvasAvatar, ItemArt,
 * RewardPackModal — para dar para olhar o que o jogo desenha sem precisar
 * entrar na conta e chegar na tela certa. Ela sempre existiu em tools/, mas so
 * abria por caminho (`/tools/avatar-preview.html`), e o painel de preview do
 * Claude Code so consegue mostrar a RAIZ de um servidor: qualquer caminho ele
 * devolve para `/`, e quem aparecia era o app.
 *
 * Aqui `tools/` E a raiz. Abrir a porta 3010 ja cai na bancada.
 *
 * Nao mexe no app: outra porta, outro processo, e `npm run build` continua
 * empacotando so o index.html da raiz do projeto.
 */
export default defineConfig({
    root: fileURLToPath(new URL('./tools', import.meta.url)),
    // A pasta public continua sendo a do projeto: e de la que sai toda a arte
    // (`/assets/catalog/...`). Sem isto o Vite procuraria tools/public e a
    // bancada abriria com todo PNG quebrado.
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    server: {
        port: 3010,
        host: '0.0.0.0',
        fs: {
            // Os componentes e o index.css moram FORA da raiz desta bancada.
            // Sem isto o Vite recusa servir `../components/...` por seguranca.
            allow: [fileURLToPath(new URL('.', import.meta.url))],
        },
    },
    plugins: [react(), tailwindcss()],
    define: {
        __APP_VERSION__: JSON.stringify('bancada'),
        'process.env.API_KEY': JSON.stringify(''),
        'process.env.GEMINI_API_KEY': JSON.stringify(''),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('.', import.meta.url)),
        },
    },
});
