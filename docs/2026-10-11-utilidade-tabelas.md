# Utilidade das tabelas — triagem de 11/10/2026

Sem exclusão, alteração de schema ou classificação por estar vazia. Lista oficial: 100 tabelas public enviada por Afonso. Estimativas de volume não são contagem exata. Dependências remotas fora dos nove backups ainda não verificadas.

## Sobras com evidência forte

Os nove backups de 12/03 e 15/03: contagem exata zero, consultas de dependências e menções em funções vazias, busca de cron sem resultados, nenhuma referência direta no código pesquisado. São candidatos fortes à retirada, sem necessidade funcional encontrada; chamadas dinâmicas e clientes externos não são excluídos por essas buscas. Nenhum DROP preparado ou executado nesta rodada.

## Preservar: usos encontrados

- reports: contexts/GameContext.tsx:4714 faz upsert na migração de dados locais. Não confundir com sitrep_reports, usado por leitura/escrita atual de relatórios. É caminho de compatibilidade, não comprovadamente morto.
- era_metadata: views/ReportsView.tsx lê e grava os metadados das eras. era_boundaries: mesma tela lê/grava divisões e Garden3DModal lê after_report_id. Mantê-las mesmo com estimativa zero.
- marco1_beta_tracking: o painel consulta a view marco1_beta_scoreboard (views/SovereignPanelView.tsx:2131), cujo SQL referencia a tabela. beta_program_checkins: SupabaseService.processBetaProgramCheckIn chama process_beta_program_checkin; GameContext mantém esse fluxo. A retirada do programa do VANGUARDA25 não removeu o subsistema inteiro.
- user_pity_counters: referenciada pelo SQL de abertura de baús. Não classificar como órfã pela ausência de consulta direta no cliente; confirmar definição remota caso se revise essa mecânica.
- convites/convites_usados: o novo programa consulta por RPC. As tabelas vazias podem estar aguardando o primeiro uso.
- reward_codes/reward_code_redemptions/store_prices/user_purchases: resgate e entrega no servidor. Não são sobras por ausência de acesso direto do navegador.
- account_deletion_web_requests: existe pedido registrado na estimativa e o fluxo de processamento ainda está em revisão. Não remover a fila porque o site atual encaminha por e-mail.

## Incertas — próximo SQL oficial

- assets e user_assets: nenhum acesso direto por nome encontrado nos consumidores pesquisados. O nome assets também designa uma aba, objetos em memória e colunas JSON; esses matches não comprovam uso da tabela.
- pvp_challenges: não encontrado consumidor direto; competições atuais têm tabelas relationship_competition_*. A semelhança de função não basta para concluir substituição.
- legacy_render_jobs: migration define fila de renderização (payload, vídeo, poster, status), mas não localizei produtor/worker nos consumidores pesquisados. Pode haver serviço externo.
- asset_slots: estimativa 24 registros, sem consumidor direto encontrado. Inspecionar dependências antes de concluir qualquer coisa.
- daily_comparison_exclusions: sem consumidor direto encontrado; finalidade precisa ser confirmada pela estrutura e funções remotas.

Próxima consulta, somente leitura: supabase/CHECK-tabelas-candidatas-legado.sql. Retorna colunas, dependências e menções em funções/cron das seis tabelas. Não retorna dados de jogadores; menção textual é pista, não prova de chamada.

## Complemento — definições oficiais enviadas por Afonso

- daily_comparison_exclusions: acesso real no NOT EXISTS de get_daily_comparison(date). Consumidor encontrado em hooks/useDailyComparison.ts (busca anterior não cobriu hooks); manter. A comparação exige pelo menos dez participantes elegíveis para retornar resultado.
- get_public_profile_cards e get_public_profile_data: usam user_profiles, asset_levels e outros objetos; as ocorrências de assets vêm de campos/permissões, não de acesso à tabela public.assets. Isso resolve essas duas menções, não todas as rotinas de competição.
- handle_new_user(): insere efetivamente dez linhas em user_assets, com categorias antigas. Também contém ramo que atribui admin por um e-mail fixo, avatar picsum e baús no JSON do perfil. Definição parece legado; existência não comprova execução. Antes de qualquer retirada, consultar quais gatilhos estão ligados à função e seus estados, especialmente auth.users. Se ativa, requer revisar bootstrap antes de remover user_assets.

## Entrega da limpeza restrita — 12/10/2026

Afonso autorizou somente os nove backups históricos, user_assets e handle_new_user(). A consulta oficial de gatilhos retornou sem linhas. O pentágono atual usa asset_levels; os textos dos slots usam user_profiles.asset_widget_values.

SQL preparado: supabase/migrations/20261011180000_remove_confirmed_legacy_tables.sql. Ainda não executado no Supabase. Reconfere ausência de registros sob bloqueio, gatilhos, menções em rotinas e cron; usa RESTRICT e transação. Qualquer bloqueio desfaz a limpeza inteira. asset_levels, asset_slots e as demais candidatas ficam preservadas.

Validação local: node tests/legacy-table-cleanup.regression.mjs passou nos cinco cenários (vazio/idempotência, dados, gatilho, view dependente e tarefa cron). Isso valida as proteções locais, não comprova execução em produção.
