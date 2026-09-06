# Passo 2 — progresso visível

## Alterações

- `components/ArenaCard.tsx`: texto acima da barra e identificação acessível do progresso. Contagem de ações em arenas homogêneas; marcos quando esse é o único tipo; percentual para tipos mistos, compartilhados ou percentual externo diferente do cálculo local. Arena Livre continua sem meta inventada.
- `utils/arenaProgressPresentation.ts:describeArenaProgress`: formata os números existentes, sem alterar cálculo ou EXP. O total excedente continua visível, sem restante negativo.
- `utils/arenaProgressPresentation.ts:getArenaPresentationTasks`: extrai o recorte de apresentação já usado no card para reutilizá-lo no toast.
- `contexts/gameDomains/taskDomain.ts:showTaskProgressToast`: confirmação curta depois dos caminhos de salvamento, independente da presença. Exemplo: Treino: 5/7 ações · faltam 2. Ações Livre recebem confirmação sem meta. Conclusão de arena/campanha mantém seu toast existente, evitando substituí-lo por outro. Arenas compartilhadas e quests de clã preservam seus avisos próprios.
- `contexts/GameContext.tsx:createTaskDomain`: passa o marcador da rodada para o recorte de apresentação do toast.
- `tests/arena-progress-presentation.regression.mjs`: 11 cenários de unidades, Livre, tipos mistos, compartilhamento, excedente e escopo.

## Limites e escopo

Não houve mudança em fórmulas de progresso, EXP ou nota, nos bancos/regras de falas do Oráculo nem nos modais protegidos. Sem SQL necessário, commit, push, publicação ou AAB. A nomenclatura usa ações porque o cálculo atual conta conclusões; não presume que todas sejam sessões nem soma minutos com repetições.

Prova local de código e testes. Não houve inspeção visual no aparelho, verificação tátil, salvamento contra produção ou teste de entrega implantada. O espaço/contraste dos cards compactos ainda precisa de conferência visual. A falha de salvamento mantém o caminho de erro/reversão existente; não foi simulada contra backend nesta etapa.

Passo 3 ainda não executado. O usuário prepara outro Markdown sobre a voz do Oráculo; esta etapa não modifica seus textos.

## Saídas reais

Todos os comandos terminaram com código 0.

### `npx tsc --noEmit`

Sem saída; código de saída 0.

### `npm run test:arena-pacts`

```text
> glyph-app@1.0.81 test:arena-pacts
> node tests/arena-pacts.regression.mjs

Arena pacts regression: nao propoe arena invalida, conta dias e ignora o passado.
```

### `npm run test:oracle-reaction`

```text
> glyph-app@1.0.81 test:oracle-reaction
> node tests/oracle-reaction.regression.mjs

Oracle reaction: a reacao lembra, sabe o que aconteceu, e a dica olha a tela.
```

### `npm run test:oracle-arbiter`

```text
> glyph-app@1.0.81 test:oracle-arbiter
> node tests/oracle-arbiter.regression.mjs

Oracle arbiter: candidatos competem, o pior de cada tipo fala primeiro, e o silencio e uma resposta valida.
```

### `npm run test:core-loop`

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

### `npm run test:mission-reward`

```text
> glyph-app@1.0.81 test:mission-reward
> node tests/mission-reward-unification.regression.mjs

Mission reward unification: um ritual, quatro resgates, uma autoridade de patente.
```

### `node tests/reward-modal-priority.regression.mjs`

```text
Reward modal regression: daily summary, season, cycle, challenge and rank flows are wired and gated.
```

### `npm run test:oracle-presence-policy`

```text
> glyph-app@1.0.81 test:oracle-presence-policy
> node tests/oracle-presence-policy.regression.mjs

Oracle presence policy: silencioso cala, equilibrado celebra o grande, presente acompanha tudo.
```

### `node tests/arena-progress-presentation.regression.mjs`

```text
Arena progress presentation: 11 cenarios validados (unidades, livre, mistos, compartilhado, excedente e escopo).
```

