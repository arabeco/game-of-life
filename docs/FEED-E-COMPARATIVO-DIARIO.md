# Feed, patentes e comparativo diário

Implementação local de 15/09/2026.

- Publicação no feed somente por comando do usuário, com confirmação do banco antes de exibir sucesso. Toques concorrentes são bloqueados enquanto a requisição está em andamento.
- O resumo publicado guarda números, nomes e ícones do momento da publicação. Alterar o Planner depois não altera esses dados. O painel e o feed usam `DailySummaryCard`; posts antigos continuam com apresentação compatível.
- A escada existente abre o próximo degrau com suas recompensas e XP restante. Os modais de recompensa foram preservados.
- “Entregas” foi substituído por “ações concluídas”.

## Comparação: ativação pendente

Aplicar `supabase/migrations/20260915120000_daily_comparison.sql` no projeto correto e recarregar o app. **Não foi aplicada em produção nesta rodada.**

A tabela de exclusões tem RLS habilitada, sem acesso para anon/authenticated. A função autenticada usa SECURITY DEFINER para agregar a população e retorna apenas estatísticas do próprio usuário, sem identificar outros jogadores. A consulta não é um ranking público nem uma garantia antifraude.

Regras: pelo menos 100 jogadores com ações concluídas no dia; excluir contas técnicas pelos padrões definidos no SQL, perfis não jogadores e IDs cadastrados administrativamente em `daily_comparison_exclusions`. Empates ocupam o final do grupo empatado. XP de ações livres não entra. Dias usam corte às 04h em America/Sao_Paulo; consulta limitada aos últimos 30 dias.

O cartão apresenta no máximo um destaque: ações, ou XP base quando o primeiro não está entre os 25% superiores. Hoje é identificado como parcial. Se os números locais diferirem dos agregados, o destaque fica oculto. Dias passados também podem mudar se houver edição retroativa; o post mantém o texto capturado ao publicar.

Há cache de dez minutos no cliente e atraso curto para evitar consulta a cada renderização. Não existe consolidação periódica no servidor nesta versão; medir custo da agregação antes de ampliar a população. Ausência da função não impede o uso do painel.

## Evidências

- `node tests/feed-publication.regression.mjs`: backend sintético; privacidade, falhas, confirmação e concorrência.
- `node tests/daily-feed-snapshot.regression.mjs`: dados publicados preservados, posts inválidos/antigos, critérios de exibição e dados defasados.
- `node tests/daily-comparison-sql.regression.mjs`: SQL real executado em PGlite local, com população sintética de 100 jogadores, empates, corte diário e exclusões.
- `npm run build`: passou.
- Prévia do componente React com 12 ações: duas linhas, quadrados de 2.35rem, cartão sem rolagem interna. Dados ilustrativos; não comprova fluxo autenticado nem compartilhamento nativo Android.
- A checagem TypeScript global ainda aponta erros em outras partes do projeto; não considerar o projeto inteiro livre de erros de tipos.
