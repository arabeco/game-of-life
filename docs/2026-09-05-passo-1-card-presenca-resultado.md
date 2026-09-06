# Passo 1 — card automático no Equilibrado

## Mudança

- `contexts/GameContext.tsx:shouldPushOracleFeedMessage`: limite de presença alterado de `< 3` para `<= 0`, alinhando esse limite ao envio remoto. Presença Equilibrado passa; Silencioso continua bloqueado.
- `tests/oracle-presence-policy.regression.mjs`: executa a função local extraída do código para presenças 0/1/2/3, card automático, pedido manual e formato não informativo no modo neutro.

Escopo restrito à divergência de presença. Filtros legados por modo, alerta de sequência e outras diferenças de entrega não foram redesenhados. O teste injeta o perfil equilibrado do modo neutro para isolar o comportamento do filtro local; não simula entrega no aparelho.

Sem SQL necessário, implantação, commit, push ou AAB. EXP, nota do ciclo e modais protegidos não foram alterados. Outras alterações preexistentes do checkout foram preservadas.

## Verificação — saídas reais

Todos os comandos abaixo terminaram com código de saída 0. `npx tsc --noEmit` não produziu saída.

```text
> glyph-app@1.0.81 test:oracle-presence-policy
> node tests/oracle-presence-policy.regression.mjs

Oracle presence policy: silencioso cala, equilibrado celebra o grande, presente acompanha tudo.

> glyph-app@1.0.81 test:arena-pacts
> node tests/arena-pacts.regression.mjs

Arena pacts regression: nao propoe arena invalida, conta dias e ignora o passado.

> glyph-app@1.0.81 test:oracle-reaction
> node tests/oracle-reaction.regression.mjs

Oracle reaction: a reacao lembra, sabe o que aconteceu, e a dica olha a tela.

> glyph-app@1.0.81 test:oracle-arbiter
> node tests/oracle-arbiter.regression.mjs

Oracle arbiter: candidatos competem, o pior de cada tipo fala primeiro, e o silencio e uma resposta valida.

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

> glyph-app@1.0.81 test:mission-reward
> node tests/mission-reward-unification.regression.mjs

Mission reward unification: um ritual, quatro resgates, uma autoridade de patente.
```

Comando direto `node tests/reward-modal-priority.regression.mjs`:

```text
Reward modal regression: daily summary, season, cycle, challenge and rank flows are wired and gated.
```

## Limite da prova e próxima etapa

Prova local de código e regressão. Não houve teste de notificação no aparelho nem validação de versão implantada. Nenhuma afirmação de entrega real de push.

Passo 2 ainda não executado: progresso visível no card da arena e no toast. Pausa entre passos conforme briefing aceito.
