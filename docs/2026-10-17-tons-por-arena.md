# Tons por arena — integração

Paleta aprovada em `docs/drafts/arena-tons-planner.html`, centralizada em
`utils/arenaTones.ts`. Cinco tons por área, com repetição a cada cinco arenas.
Miniaturas, modais e ações do Planner usam a mesma origem de cor. Os botões de
criação continuam usando os tokens de skin. Gradientes especiais de quests são preservados.

## Persistência

Migração `20261017190000_arena_color_tones.sql` aplicada ao projeto Supabase
vinculado em 17/10/2026, depois de teste com rollback integral.

- `arenas.color_tone_sequence` guarda a sequência permanente.
- `arena_tone_counters` mantém o próximo número por usuário/área mesmo após excluir arenas.
- Trigger aloca atomicamente, inclusive para clientes antigos e criação por SQL/RPC.
- Edição, reordenação e upsert preservam o tom; troca de área aloca na área de destino.
- Backfill segue `created_at, id`, inclui arquivadas e não altera ações/agendamentos.
- O backfill usa o sinalizador transacional de manutenção já existente para permitir
  adicionar metadados visuais em snapshots protegidos de competição.
- Conferência remota: 38 arenas totais, 37 elegíveis, zero sem tom, 14 contadores,
  um trigger. Nenhum registro de teste permaneceu.
- Snapshots antigos/offline sem o campo recebem fallback estável por ID. Isso não
  substitui o tom persistido retornado pelo banco na hidratação autenticada.

## Verificação

- TypeScript sem erros.
- Vite build concluído (avisos já existentes de chunks/importações).
- `arena-tones.regression.mjs`: paletas, repetição, exclusão, aliases, snapshots inválidos, quests.
- `arena-progress-presentation.regression.mjs`: 11 cenários.
- `cycle-scheduling.regression.mjs`: passou.
- Teste SQL transacional: criação consecutiva, edição, upsert, exclusão, troca de área,
  continuidade de contador e ausência de arenas antigas sem tom; rollback ao final.
- Prévia com componentes React reais e dados simulados em
  `output/modal-integration/preview.html?mode=palette`.
- Captura: `output/modal-integration/paleta-integrada-app.jpg`.
- Miniatura com 76px e distância medida de aproximadamente 6.3px entre ações e progresso.

Código web local e banco atualizados. Não houve publicação web, geração de AAB ou
validação em aparelho Android nesta tarefa.
