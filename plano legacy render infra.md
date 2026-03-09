# Infra do Render de Legado

## Objetivo
Gerar `legacy.mp4` e `poster.png` server-side a partir do payload congelado do legado, sem depender do browser do usuario.

## Pecas
1. Banco `public.legacy_render_jobs`
2. Bucket Supabase Storage `legacy-renders`
3. Rota isolada do app: `?render=legacy&payload=...&capture=1`
4. Worker externo com `Playwright + FFmpeg`

## Variaveis de ambiente do worker
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LEGACY_RENDER_BASE_URL`
- `LEGACY_RENDER_BUCKET=legacy-renders`
- `LEGACY_RENDER_POLL_MS=10000`
- `LEGACY_RENDER_FPS=12`

## Infra minima recomendada
### Opcao enxuta
- Railway ou Render
- 1 service Node para o worker
- 1 volume temporario nao persistente ja basta, porque os frames sao apagados no final

### Binarios obrigatorios
- `playwright`
- navegadores do Playwright instalados
- `ffmpeg` no PATH

## Bucket
Criar bucket:
- `legacy-renders`

Sugestao:
- manter privado no inicio
- liberar download depois via signed URL ou edge function

## Fluxo real
1. App cria job em `legacy_render_jobs`
2. Worker busca `pending`
3. Worker marca `processing`
4. Worker abre `LEGACY_RENDER_BASE_URL?render=legacy&payload=...&capture=1`
5. Worker captura `poster.png`
6. Worker captura frames da cena
7. Worker monta `legacy.mp4` com FFmpeg
8. Worker sobe `poster.png` e `legacy.mp4` no bucket
9. Worker marca job `completed`
10. App mostra status e caminho do arquivo

## Decisoes tomadas
- Payload fica em `jsonb` no job
- Isso congela a cena no momento do pedido
- Mudancas futuras nas Eras nao mudam renders antigos

## O que ainda falta para producao
1. Download real do video no app
2. Signed URL ou bucket publico controlado
3. Limpeza automatica de jobs antigos e arquivos antigos
4. Reprocessar job falho
5. Telemetria minima do worker

## Comando local do worker
`npm run worker:legacy-render`

## Observacao
O repo ja tem o scaffold do worker em `scripts/legacy-render-worker.mjs`, mas ele so roda de verdade quando o ambiente externo tiver `playwright`, navegadores e `ffmpeg`.
