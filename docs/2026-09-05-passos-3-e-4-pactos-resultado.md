# Passos 3 e 4 — resultado local — 05/09/2026

## Passo 3: retirada da sequência global

- `GameContext.registerDailyProofAction`: mantém o histórico e reconhecimento de retomada; remove elogio diário de sequência, cobrança e estímulo sensorial global.
- `oracleCandidates.detectOracleCandidates`: remove detectores de risco e marcos de sequência. Demais candidatos continuam.
- `oracleReaction.resolveReactionSignificance`: mantém retorno após pausa, retira salvamento de sequência.
- `oracle-host-voice.deriveOracleHostOperationalState`: não seleciona estados de sequência; a diretriz também proíbe presumir compromisso de dias consecutivos.
- `oracle/index.ts`: retira cron de alerta de sequência.
- `web-push.shouldPushOracleMessage` e filtro local: bloqueiam alertas/estados legados, inclusive retries; preservam cards automáticos e bloqueio de pedidos manuais/falas.
- `OracleSettingsModal`: retira controle de aviso de perda de sequência.
- `AVAILABLE_SYSTEM_CHALLENGES`, SeasonView e onboarding: retiram desafio de cinco dias das novas ofertas. `SYSTEM_CHALLENGES` mantém definição para interpretar os aceites antigos.

Compatibilidade: SQL fotografa quem já aceitou o desafio de cinco dias e impede ampliar essa coorte por atualizações de perfil. O resgate antigo continua disponível à coorte, com regras e marcadores de pagamento existentes. Nenhum prêmio já pago é removido. Contadores e bancos antigos de frases permanecem compatíveis com histórico; os detectores removidos não os selecionam.

## Passo 4: volume com prazo

- `utils/arenaPacts.ts`: kind `volume`, `endsOn`, proposta, contagem e restauração do perfil.
- `types.ts` e `GameContext`: persistência de `arenaPactEndsOn`; aceite e encerramento por RPC; resgate existente evoluído.
- `ArenaPactBalloon`: objetivo, progresso em ações, janela explícita, fim da janela e encerramento sem penalidade.
- `OracleChat`: entrada “Pedir pacto”.

| Faixa existente | Meta | Recompensa existente |
| --- | --- | --- |
| Leve | 3 ações em 7 dias | 2 ouro + 100 EXP |
| Média | 6 ações em 14 dias | 5 ouro + 300 EXP |
| Alta | 10 ações em 21 dias | 10 ouro + 500 EXP + baú Raro |

A faixa segue o seletor existente da arena; esta entrega não cria editor de quantidade/prazo.
Conta tarefas concluídas da arena, exclui Livre, não duplica IDs e aceita somente datas operacionais dentro da janela e até hoje. A virada é às 4h. Registro tardio de uma atividade dessas datas conta enquanto o pacto estiver aberto; isso não estende a janela das atividades. Descansar não reinicia nada.

SQL confere a contagem, fixa metas/janelas por faixa, serializa operações pelo perfil e preserva os marcadores de resgate. Após pagar volume, bloqueia novo volume na mesma arena até passar a janela paga, evitando reutilizar suas datas. Encerrar pacto não remove ações/EXP.

## SQL pronto

[20260905180000_pact_volume_retire_global_streak.sql](../supabase/migrations/20260905180000_pact_volume_retire_global_streak.sql)

Aplicar o arquivo completo no SQL Editor do projeto correto. O arquivo é transacional e depende do esquema/migrations anteriores de pactos, recompensas e Oráculo. Reaplicação mantém a coorte inicial.

**O SQL não foi executado.** Foi validado apenas por parser PostgreSQL/PLpgSQL, que não comprova esquema remoto, RLS, permissões nem pagamento real. O parser foi instalado como ferramenta local, sem alterar dependências do app.

Depois do SQL, publicar o app e atualizar as Edge Functions `oracle` e `web-push` (a primeira inclui o módulo compartilhado de voz). Nenhuma publicação foi feita nesta entrega.

## Limites preservados e pendências de ativação

- Fórmula, depósito e reconciliação de EXP; nota justa do ciclo; componentes protegidos de recompensa: não alterados por estes passos.
- EXP/baú de pacto continuam no fluxo existente de `grantMissionReward`; a transação SQL garante o ouro. Esta entrega não torna o fluxo inteiro de EXP/baú uma transação única de servidor.
- Nenhuma modalidade consecutiva nova, tabela de missões, commit, push, AAB ou deploy.
- SQL bloqueia novos alertas/estados de sequência e falas antigas identificáveis; não apaga histórico. Não consegue impedir um binário antigo de exibir fala/sensação offline antes de tentar gravar. Atualização do app é necessária.
- Backend usa America/Sao_Paulo, como já fazia. Cliente segue fuso local para a virada operacional. Unificação de fusos não faz parte destes passos; usuários em outro fuso podem ver divergência perto das 4h.
- Sem validação visual em aparelho nem resgate real no Supabase, pois o SQL foi pedido para aplicação pelo usuário.
- Não reescrevi o novo MD de repertório que o usuário está preparando.
- O briefing acerta a existência de recompensa além do ouro: as faixas de EXP e baú acima foram preservadas.

## Validação real

`npx tsc --noEmit`: código de saída 0; saída vazia.

Uma primeira execução do novo teste de catálogo falhou porque um import apenas de tipos estava declarado como import comum, incompatível com a execução direta pelo Node. Corrigido para `import type`; a execução final passou. O parser identificou dois CASE em condições PL/pgSQL que precisavam de parênteses; corrigidos antes da validação final abaixo.

### npm run test:core-loop

Saída real; código de saída 0.

```text
> glyph-app@1.0.81 test:core-loop
> node tests/core-loop.regression.mjs

ok - weekly atlas divide o ciclo em semanas sequenciais do periodo real
ok - weekly atlas agrega buckets por arena e define arena dominante
ok - rollback util remove apenas ids afetados
ok - restore snapshot nao ressuscita tarefa ja removida
ok - toggle snapshot completa tarefa da bay area no horario atual
ok - toggle snapshot preserva horario ao desmarcar ou completar tarefa ja agendada
ok - exp nao julgada soma apenas tarefas rastreadas concluidas com premium
ok - exp nao julgada reage a tirar e desfazer conclusao
ok - pool diario usa a mesma regra para planner e sitrep
ok - pool do ciclo consome acoes paradas na bay em qualquer dia
ok - ultima instancia sai do bay ao virar tarefa planejada
ok - bay area esconde duplicata velha quando ultima instancia ja foi planejada
ok - classificacao de arena centraliza quest shared office e fallback legado
ok - quick action agendada hoje entra no compromisso diario sem duplicar
ok - remarcar ou trocar para quest reconcilia o compromisso diario
ok - sitrep inicial puxa automaticamente tarefas ja planejadas do dia
ok - devolver tarefa para o pool faz o estoque do SITREP reaparecer
ok - arena foco do dia usa apenas tarefas travadas e conta concluidas
ok - escopo do ciclo ignora tarefas fora das arenas do ciclo mesmo na mesma data
ok - metricas de ritmo do ciclo mostram dias zerados e compasso
ok - campanha sequencial estilo codex destrava a proxima arena ao limpar a anterior
ok - arena compartilhada usa progresso global e campanha calcula progresso combinado correto
ok - metas seladas agregam arenas completas em proporcao 3/4
ok - monotarefa profunda recebe A com 1 meta selada
ok - overplanner perde nota mesmo com muito volume
ok - tiozao consistente recebe A com carga pequena e honesta
ok - ciclo de sobrevivencia recebe B em vez de punicao exagerada
ok - ciclo com sinal insuficiente cai para low_signal
ok - recalculo cronologico usa baseline dos relatorios anteriores

29 cenarios do core loop validados.
```

### npm run test:mission-reward

Saída real; código de saída 0.

```text
> glyph-app@1.0.81 test:mission-reward
> node tests/mission-reward-unification.regression.mjs

Mission reward unification: um ritual, quatro resgates, uma autoridade de patente.
```

### node tests/reward-modal-priority.regression.mjs

Saída real; código de saída 0.

```text
Reward modal regression: daily summary, season, cycle, challenge and rank flows are wired and gated.
```

### node tests/arena-progress-presentation.regression.mjs

Saída real; código de saída 0.

```text
Arena progress presentation: 11 cenarios validados (unidades, livre, mistos, compartilhado, excedente e escopo).
```

### npm run test:arena-pacts

Saída real; código de saída 0.

```text
> glyph-app@1.0.81 test:arena-pacts
> node tests/arena-pacts.regression.mjs

Arena pacts regression: nao propoe arena invalida, conta dias e ignora o passado.
Volume: oferta, prazo inclusivo, virada 4h, exclusoes, duplicatas, futuro, retroativo e restauracao validados.
```

### npm run test:oracle-reaction

Saída real; código de saída 0.

```text
> glyph-app@1.0.81 test:oracle-reaction
> node tests/oracle-reaction.regression.mjs

Oracle reaction: a reacao lembra, sabe o que aconteceu, e a dica olha a tela.
```

### npm run test:oracle-arbiter

Saída real; código de saída 0.

```text
> glyph-app@1.0.81 test:oracle-arbiter
> node tests/oracle-arbiter.regression.mjs

Oracle arbiter: candidatos competem, o pior de cada tipo fala primeiro, e o silencio e uma resposta valida.
```

### npm run test:oracle-presence-policy

Saída real; código de saída 0.

```text
> glyph-app@1.0.81 test:oracle-presence-policy
> node tests/oracle-presence-policy.regression.mjs

Oracle presence policy: silencioso cala, equilibrado celebra o grande, presente acompanha tudo.
Push: cards preservados; sequencia antiga bloqueada no servidor e no fallback local em todas as presencas.
```

### node tests/oracle-pact-retirement.regression.mjs

Saída real; código de saída 0.

```text
Retirada global: catalogo novo/legado, 15 estados de voz, ausencia de cron/sensorial e sintaxe de 3 Edge Functions validados.
```

### Parser SQL — sem execução

```text
SQL: 33 instrucoes validadas por parser, sem execucao.
PASS create or replace function public.guard_retired_streak_and_volume_pact()
PASS create or replace function public.accept_arena_pact(p_arena_id uuid,p_kind text,p_difficulty text,p_goal integer)
PASS create or replace function public.abandon_arena_pact()
PASS create or replace function public.claim_arena_pact_reward()
PASS create or replace function public.claim_glyph_progress_gold(p_reward_id text)
PASS create or replace function public.suppress_retired_streak_message()
PASS create or replace function public.retire_global_streak_alert_preference()
```

