# Plano de upgrade do Oraculo, streak e dopamina de acao

## Contexto

Este documento existe para corrigir o rumo antes de empilhar mais features.

O conceito certo nao e:

> Fechei o Painel Diario, ganhei streak.

O conceito certo e:

> Fiz uma acao real hoje, mantive minha linha viva.

O Painel Diario fecha e revisa o dia. A acao prova o dia.

## Correcao principal

A streak principal nao deve depender de fechar o Painel Diario.

Comportamento desejado:

1. A streak principal sobe quando o usuario completa a primeira acao real do dia.
2. Pode ser acao planejada, acao do Planner, acao de arena/ciclo ou acao criada pelo usuario.
3. Fechar o Painel Diario pode continuar dando recompensa, EXP e revisao, mas nao deve ser o gatilho principal da streak.
4. O Painel Diario e util, mas pode ser burocratico. A dopamina principal precisa estar no ato de completar acao.
5. O Planner deve mostrar essa streak real de execucao diaria.
6. Ao completar a primeira acao do dia:
   - aumentar streak automaticamente;
   - tocar haptic leve;
   - mostrar feedback visual curto;
   - depositar/animar EXP no rodape ou barra onde fizer sentido;
   - permitir que o Oraculo comente a sequencia.

## Auditoria obrigatoria

Antes de implementar mais coisa, responder:

1. Hoje a streak esta atrelada a qual evento exatamente?
   - `endDailyBattle`?
   - completar tarefa/acao?
   - outro?
2. Quais campos existem em `user_profiles`?
   - nome exato;
   - tipo;
   - default;
   - se aceita `null`.
3. Quais arquivos foram editados para streak?
   - explicar funcao por funcao;
   - separar codigo real de documentacao.
4. A migration foi aplicada:
   - local?
   - remoto/producao?
5. Usuario antigo sem campo novo quebra?
   - app trata `null`?
   - Edge Function trata `null`?
6. Fechar Painel Diario duas vezes no mesmo dia duplica streak?
   - onde esta a trava?
7. Completar duas acoes no mesmo dia duplica streak?
   - se ainda nao existe, precisa existir.
8. Pular um dia reinicia corretamente?
   - qual e a regra exata?
9. O calculo usa data operacional/local corretamente?
   - `getOperationalDateString`;
   - cuidado com UTC.
10. O Planner mostra qual streak agora?
    - streak de painel fechado;
    - ou streak de acao concluida.
11. O modal do Painel Diario mostra streak?
    - se sim, remover ou transformar em informacao secundaria.
12. O Oraculo recebe quais dados de streak?
    - chat local;
    - Edge Function `supabase/functions/oracle/index.ts`;
    - notificacoes/push.
13. O Oraculo usa esses dados em frase real ou so recebe no contexto?
14. Existe risco de citar streak quando ela esta em `0`?
15. A estrela no perfil apenas leva para `Mundo > Feitos`?
16. Ficou alguma tela paralela de "memoria de progresso"?
17. Foi criado algum sistema novo de achievements?
   - se sim, parar e remover.
18. O build passou?
   - comando;
   - resultado.
19. Testes manuais necessarios:
   - usuario sem streak;
   - completar primeira acao do dia;
   - completar segunda acao no mesmo dia;
   - fechar Painel Diario;
   - abrir Planner;
   - abrir Oraculo;
   - simular proximo dia;
   - simular quebra de sequencia.
20. O que ainda esta so em MD/documentacao?

## Correcao de implementacao desejada

Mudar o gatilho principal da streak:

```text
DE:
fechamento do Painel Diario

PARA:
primeira acao concluida no dia
```

Regra:

Quando o usuario completa uma acao, verificar se ja houve prova real hoje.

Se nao houve:

- incrementa `dailyProofStreak.current`;
- atualiza `dailyProofStreak.best`;
- incrementa `dailyProofStreak.totalProofDays` ou equivalente;
- salva `lastProofDate`;
- salva `lastProofActionId`;
- salva `lastProofArenaId` se existir;
- salva `lastProofCycleId` se existir;
- dispara feedback visual/haptic.

Se ja houve prova real hoje:

- nao incrementa streak;
- completa a acao normalmente;
- pode dar EXP normal;
- nao aumenta sequencia.

Painel Diario:

- pode continuar fechando o dia;
- pode mostrar resumo;
- pode dar recompensa propria;
- nao deve ser obrigatorio para manter streak.

## Oraculo: frases variaveis

O Oraculo nao deve usar sempre a mesma frase.

Implementar um registry de frases por:

- estado operacional;
- tom do Oraculo;
- superficie.

Estados iniciais:

- `sem_direcao`
- `disperso`
- `atrasado`
- `em_ritmo`
- `em_risco`
- `retomando`
- `proximo_compromisso`
- `pronto_para_fechar`
- `arena_esquecida`
- `escopo_pesado`
- `oportunidade_util`
- `streak_mantida`
- `streak_quebrada`
- `primeira_acao_do_dia`

Tons:

- `neutro`
- `calmo`
- `tatico`
- `reflexivo`
- `estrategico`
- `coach`

Superficies:

- `push`
- `balao`
- `chat`
- `card`

Regras:

- ter multiplas frases por estado;
- evitar repetir a mesma frase no mesmo dia;
- evitar repetir frase vista recentemente;
- se nao houver frase especifica para tom/superficie, cair para `neutro`;
- nunca inventar dado;
- usar nomes reais de arena/acao quando existirem.

### Exemplos: primeira acao do dia

Neutro:

> Primeira prova do dia registrada. A sequencia continua viva.

Calmo:

> Boa. Nao precisou ser perfeito; so precisava comecar.

Tatico:

> Prova real feita. Agora escolha a proxima acao sem abrir outra frente.

Coach:

> E isso. A sequencia vive de acao, nao de intencao.

Estrategico:

> Uma acao concluida muda o estado do dia. Agora o ciclo ja tem prova.

Push:

> Primeira acao feita. Sequencia mantida.

### Exemplos: streak mantida

Neutro:

> Sequencia mantida: {dailyProofStreak} dias com prova real.

Calmo:

> {dailyProofStreak} dias seguidos. Mantem simples; uma prova por dia ja sustenta a linha.

Coach:

> {dailyProofStreak} dias. Nao quebra por perfeccionismo agora.

Estrategico:

> Sua continuidade esta virando dado real: {dailyProofStreak} dias com execucao registrada.

### Exemplos: retorno / streak quebrada

Calmo:

> Voce voltou. Nao tenta pagar tudo agora; registra uma prova e recomeca o fio.

Neutro:

> A sequencia anterior quebrou, mas o sistema continua. Uma acao hoje reinicia o ritmo.

Coach:

> Caiu, voltou, registra prova. O jogo e retorno, nao drama.

## Slider de presenca do Oraculo

Confirmar se isso virou codigo ou ainda esta so no MD.

Estados desejados:

0 - Silencioso

- Sem Oraculo proativo.
- So sistema/avisos criticos se ativados.

1 - Leve

- Poucos lembretes.
- Acoes com horario, fechamento importante e risco real.

2 - Equilibrado

- Padrao recomendado.
- Pode falar de ciclo, arena parada, painel, streak e oportunidade util sem exagerar.

3 - Presente

- Mais companion.
- Pode lembrar streak, retorno, quiz, maestria, arena esquecida e acao pendente.
- Precisa de limite e anti-spam.

Perguntas:

1. O slider ja existe na UI?
2. Onde esse valor e salvo?
3. Ele influencia push?
4. Ele influencia feed?
5. Ele influencia chat/baloes?
6. Ele respeita Free/Premium?
7. Existe limite diario por nivel?
8. Existe deduplicacao para nao repetir assunto?
9. Ele respeita horario silencioso?
10. Ele muda tom ou so frequencia?

## Completar acao: dopamina leve

Depois de corrigir a streak para primeira acao do dia, melhorar a sensacao de completar acao no Planner.

Auditoria antes de mexer:

1. Ja existe haptic ao completar acao?
2. Ja existe animacao de EXP?
3. Onde a EXP e depositada visualmente?
4. A barra/rodape mostra aumento na hora?
5. A primeira acao do dia tem feedback diferente?
6. Existe som?
7. Som e opcional?
8. Existe configuracao para reduzir animacoes/haptic?
9. O feedback funciona no localhost?
10. O feedback funciona no Android/Capacitor?

Desejado:

- completar acao deve ter feedback visual curto;
- primeira acao do dia deve ter feedback um pouco especial;
- haptic leve, nao agressivo;
- EXP subir/animar onde o usuario entende;
- Oraculo pode soltar frase curta, mas nao sempre;
- nao criar modal gigante para toda acao.

## Perguntas extras antes de implementar

### Produto

1. A streak deve chamar "sequencia", "linha", "ritmo" ou outro nome na UI?
2. Em modo Basic, a streak aparece igual ou mais discreta?
3. A streak deve aparecer no perfil ou so Planner/Oraculo?
4. A streak deve aparecer no widget Android no futuro?
5. O que conta como "acao real"?
   - tarefa agendada concluida;
   - marco concluido;
   - acao livre concluida agora;
   - checklist diario;
   - sequencia/manual habit.
6. Checklist diario conta para streak?
7. Acao de clan/quest conta?
8. Acao concluida retroativamente conta?
9. Editar uma tarefa para concluida no passado conta?
10. Reabrir/desmarcar tarefa deve remover streak?

### Dados

1. O campo deve continuar `dailyProofStreak` ou renomear para `dailyActionStreak`?
2. Manter compatibilidade com `daily_proof_streak` ja aplicado no Supabase?
3. Guardar apenas JSONB ou criar tabela de eventos `daily_proofs` no futuro?
4. Precisa guardar historico de cada prova ou so estado agregado?
5. `lastProofActionId`, `lastProofArenaId`, `lastProofCycleId` podem ficar null?
6. O que acontece se a acao for deletada depois?
7. O Oraculo deve citar nome de acao deletada?
8. Como migrar a streak errada de Painel Diario que pode ter sido criada em teste?

### Regras de streak

1. Streak sobe no primeiro sucesso do dia operacional ou dia civil?
2. Dia operacional vira as 04:00, 05:00 ou meia-noite?
3. O usuario pode configurar isso?
4. Se completar uma acao 02:00 da madrugada, conta para ontem ou hoje?
5. Streak quebra visualmente quando passa o dia sem acao ou so quando o usuario volta?
6. O app deve mostrar "em risco" antes de quebrar?
7. Existe grace period?
8. Premium teria freeze de streak ou isso e brega?

### Oraculo

1. O Oraculo deve comentar streak sempre na primeira acao do dia ou so as vezes?
2. Qual nivel do slider permite comentario de streak?
3. Push de streak mantida deve existir ou so in-app?
4. Push de streak em risco deve existir?
5. Push de streak quebrada deve ser calmo ou melhor nao enviar?
6. Oraculo pode provocar levemente ou isso precisa ser raro?
7. O Oraculo deve citar numero de dias so depois de 2+?
8. Para usuario novo, frase deve evitar "sequencia" ate ter pelo menos 2 dias?
9. A frase deve variar por tom ou por modo atual do Oraculo?
10. Como registrar frases recentes para evitar repeticao?

### UI e sensacao

1. Onde exatamente a streak aparece no Planner?
2. Precisa de icone ou so numero?
3. O numero `0` aparece ou fica oculto ate comecar?
4. Primeira acao do dia deve mostrar mini-toast?
5. Esse mini-toast deve ser Oraculo falando ou sistema neutro?
6. Haptic deve ser diferente para primeira acao do dia?
7. O EXP deve animar no contador atual do Planner ou em outra area?
8. Em tela pequena, o contador de EXP e streak competem por espaco?
9. Deve haver configuracao para reduzir feedback?
10. Como testar isso no Android sem esperar Play Store?

## Trava de escopo

Nao implementar tudo de uma vez.

Ordem:

1. Auditar o que ja foi feito.
2. Corrigir streak para primeira acao do dia.
3. Garantir que Planner mostra a streak correta.
4. Garantir que Painel Diario nao e gatilho obrigatorio da streak.
5. So depois mexer em frases variaveis.
6. So depois mexer no slider.
7. So depois haptic/EXP.

Antes de cada etapa, registrar:

- arquivos que vai tocar;
- comportamento antes;
- comportamento depois;
- risco de quebrar algo;
- como testar.
