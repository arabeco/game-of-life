# Oráculo V2 — primeira implementação local

## Escopo aprovado

Leitura: ciclo e arenas, com prazo quando existe ciclo; rodada e arenas quando não existe. Abertura: planner, conclusões de hoje, estoque e retorno. Reação: uma observação sobre a conclusão e seu progresso. Nada depende de ter agendado para reconhecer progresso. Não existem cobrança por sequência, ritmo linear esperado, redução de metas ou punição por fim de semana.

Sabedoria, horários de envio e regras/texto da missão individual foram preservados. A reação pode reconhecer o andamento da missão, medido pela função existente.

## Ativação e reversão

`supabase/functions/_shared/oracle-engine-v2.ts`: `ORACLE_ENGINE_V2 = true` seleciona o novo motor. `false` restaura os caminhos antigos de abertura, reação e leitura. O código antigo permanece para comparação/reversão. A versão do servidor só muda após publicar a função `oracle`; esta implementação NÃO foi publicada.

## Decisão e frequência

- Score: meta/missão completa 100; falta uma 80; retomada 70; progresso da ação 60; arena 50. Abertura tem candidatos próprios, sem cobrança de ciclo.
- Silencioso: nenhuma fala automática no app. Leitura solicitada responde.
- Discreto: reações a conclusão de meta. Placas de conquista existentes continuam únicas.
- Equilibrado: abertura até uma por dia; reações com score >= 70.
- Presente: abertura quando há novidade, intervalo de 30 minutos; reação com score >= 40.
- Reações comuns: intervalo de 1 minuto no Presente e 5 minutos no Equilibrado; até 8/3 por dia, respectivamente. Conquistas não usam essa cota, mas mantêm 12 segundos de respiro.
- Memória por usuário em `glyph:oracle-v2:<id>`, até 120 registros. Evita repetir o mesmo progresso ao desfazer/refazer. Não é memória sincronizada entre aparelhos.
- Quando uma reação sai, suprime o toast de progresso daquela conclusão. Fecho de arena/campanha e marco com placa não recebem fala por cima.
- A abertura genérica do painel diário e a reação de retomada paralela do GameContext estão desligadas no V2.

## Narradores

Neutro gratuito; Coach, Reflexivo e Calmo conforme acesso Premium existente. Abertura e reação variam por narrador. Leitura compartilhada entre app/servidor mantém voz factual única. Frases desta primeira versão ficam no motor compartilhado para revisão editorial.

## Fontes dos números

App: `utils/oracleEngineV2.ts` usa `getArenaPresentationTasks`, `calculateArenaProgress`, `buildCycleCommitment` e `measurePactProgress`. Rodada respeita `freeProgressResetAt`. Arena compartilhada ou de missão coletiva não recebe uma estimativa local incompleta.

Servidor: `oracle-engine-facts.ts` adapta as linhas do banco; a função lê a marca de reinício e pagina tarefas. A rodada não é cortada artificialmente em 30 dias ou 1.000 tarefas. Testes comparam servidor/app, incluindo tarefas diretas, datas do ciclo, reinício e progresso da arena.

## Prévia e validação

Com o servidor `vite.patentes.config.ts`, abrir `/oracle-v2-preview.html`. Cenários fictícios; usa o motor real. Mostra narrador, frequência, estoque, planner, missão e score. Não representa uma sessão autenticada nem envia push.

Passaram: TypeScript, build web Vite, regressões do novo motor, leitura do ciclo, política de presença, um evento/uma voz e pactos. Smoke Chromium da prévia passou para silêncio, leitura manual, prioridade da missão, narrador e prazo. Bundle da função do servidor compilou sem execução.

Pendente de validação externa: push real após deploy, sessão Android e aceitação editorial das falas. Não houve publicação nem commit nesta etapa.
