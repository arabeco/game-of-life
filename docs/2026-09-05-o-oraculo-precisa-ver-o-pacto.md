# O Oráculo precisa enxergar o pacto

Instrução curta. Leia inteira antes de abrir arquivo.

---

## O problema, em uma frase

**A pessoa pede a missão ao Oráculo, ele oferece, ela aceita — e ele esquece na
hora.**

Não é figura de linguagem. Procure por `pact` em `utils/oracleOperationalContext.ts`,
`utils/oracleCandidates.ts` e `utils/oracleCoach.ts`: o pacto **não aparece em
nenhum dos três**. O Oráculo monta o contexto dele sem saber que existe um
compromisso ativo, então nunca pode falar dele.

E do ciclo ele sabe, mas usa pouco: fala quando está atrasado e quando está
adiantado, e para aí.

**O que se quer:** que a conversa do Oráculo seja sobre **o ciclo** e sobre **o
pacto que a pessoa escolheu**. Só isso. A cobrança diária global já foi removida;
o que sobra é acompanhar o que a própria pessoa aceitou.

---

## Parte 1 — fazer ele enxergar

O contexto operacional (`utils/oracleOperationalContext.ts`) precisa carregar o
pacto ativo. Os dados já existem, todos, e já estão na memória do app:

| o que | de onde |
|---|---|
| qual pacto está ativo | `rebuildActivePact` em `utils/arenaPacts.ts` |
| de qual arena | o próprio pacto |
| quanto já foi feito e quanto falta | `measurePactProgress` em `utils/arenaPacts.ts` |
| até quando | `arenaPactEndsOn` no perfil |
| o que ele paga | `ARENA_PACT_REWARDS` |

Nada disso precisa de rede, de coluna nova ou de SQL. É levar para o contexto o
que já está calculado.

**Enquanto isso não existir, nada da Parte 2 é possível.** Comece por aqui.

---

## Parte 2 — as falas

### Do pacto (não existe nenhuma)

Quatro momentos, e só para quem **aceitou**:

| momento | exemplo de conteúdo |
|---|---|
| perto de terminar | faltam N ações para fechar o pacto de {arena} |
| prazo chegando | o pacto termina {quando}; faltam N |
| terminou | o pacto foi cumprido, e o que ele pagou |
| janela venceu sem cumprir | acabou o prazo; **sem sermão, sem perda do que já foi feito** |

Quem não aceitou pacto nenhum **nunca ouve nada disso**.

### Do ciclo (metade existe)

O "Ler meu dia" (`buildOracleCycleCoachBrief` em `utils/oracleCoach.ts`) já tem
nove casos, e vários são bons. Falta:

| o que falta | como se calcula | tudo já existe no contexto |
|---|---|---|
| **a conta não fecha** | ações pendentes ÷ dias restantes, comparado ao melhor dia já registrado | `cyclePendingActions`, `cycleDaysRemaining`, `bestDailyCompletions` |
| **quanto falta, com tamanho** | "Leitura: 11 ações em 4 dias" | `arenaSignals.pendingActions` + `cycleDaysRemaining` |
| **concentração** | quanto de tudo foi numa arena só | `arenaSignals.completedActions` |
| **arena que nunca começou** | arena no ciclo com zero conclusões desde o dia 1 | `arenaSignals.completedActions === 0` |
| **vai fechar antes** | ritmo adiantado projetado nos dias que faltam | `cyclePace`, `cycleDaysRemaining` |
| **acabou** | tudo concluído, ou ciclo encerrado e nenhum novo | `arenaSignals` + `hasCycle` |

E há um texto velho para corrigir: o caso `coach:cycle-ready` diz *"feche este
ciclo"*. Hoje o ciclo vencido **fecha sozinho** — essa frase só vale para quem
terminou tudo **antes** do prazo. Reescrever para dizer isso.

---

## O que falar, e onde

Esta é a parte que faltava. **Cada lugar tem um trabalho diferente** — a mesma
informação escrita nos quatro vira ruído.

| lugar | trabalho | tamanho |
|---|---|---|
| **Reação** (você concluiu algo) | confirmar o que **acabou** de mudar | uma linha, imediata |
| **Fala de abertura** (você abriu a tela) | **uma** coisa que mudou desde a última vez | uma linha |
| **Ler meu dia** (você pediu) | a leitura completa do momento | 2–3 linhas + botões |
| **Card** | conteúdo, **não é sobre você** | próprio |

---

### Reação — quando você conclui algo

O momento em que a pessoa **está olhando**. É a fala mais barata e mais forte.

| quando | o que dizer |
|---|---|
| avanço numa arena | *"Treino: 5/7 ações · faltam 2."* (já existe, é o toast) |
| **avanço no pacto** | *"3 de 6 no seu pacto de Treino. Faltam 3, e você tem 9 dias."* — **não existe, é a maior falta** |
| pacto cumprido | *"Pacto de Treino cumprido: 6 ações em 11 dias."* + o que pagou |
| arena fechada | já existe |
| campanha fechada | já existe |
| marco concluído | já existe |
| primeira depois de uma pausa | *"Leitura ficou 19 dias parada e voltou hoje."* |
| meta do ciclo batida / falta uma | já existe |

Rotina não precisa de comentário toda vez. Marco, sim.

---

### Fala de abertura — quando você abre a tela

**Uma** linha, e só se algo mudou. Se nada mudou, silêncio é resposta certa.

| quando | o que dizer |
|---|---|
| ciclo atrasado | *"Seu ciclo está em 34%, e o tempo percorrido aponta 60%. Escolha uma ação real ou reduza uma meta que deixou de fazer sentido."* (existe) |
| ciclo adiantado | *"Você concluiu 18 de 24 e está adiantado. Do jeito que está, fecha antes do prazo."* (falta a projeção) |
| arena parada | *"Meditações está parada há 12 dias. Ou volta com algo pequeno, ou sai do ciclo sem culpa."* (existe, e o texto já é bom) |
| **arena que nunca começou** | *"Você desenhou este ciclo com 5 arenas. Duas nunca receberam um registro."* — falta |
| escopo grande demais | *"O escopo está maior do que o ciclo aguenta. Reduzir meta agora não tira EXP já conquistada."* (existe) |
| **pacto perto de terminar** | *"Faltam 2 ações para fechar seu pacto de Treino."* — falta |
| **prazo do pacto chegando** | *"Seu pacto termina amanhã, e faltam 2."* — falta |
| sem ciclo | convite ocasional, nunca dizendo que sem ciclo nada funciona (existe) |
| prioridade de hoje | *"Que tal {ação} hoje?"* (existe) |

---

### Ler meu dia — quando você pede

Pode ser mais longo, tem botões que levam, e é grátis. É a casa das leituras mais
afiadas.

| quando | o que dizer |
|---|---|
| **a conta não fecha** | *"Faltam 34 ações e 6 dias. Isso pede quase 6 por dia. Seu melhor dia até agora foram 3."* — falta, e é a mais forte de todas |
| **quanto falta, com tamanho** | *"A que mais precisa agora é Leitura: 11 ações em 4 dias."* — falta |
| **concentração** | *"Você tem 5 arenas. 7 de cada 10 registros dos últimos 14 dias foram em Academia."* — falta. Não julga, só revela |
| **comparação com o próprio histórico** | *"Você está cumprindo 68% do planejado. Nos três ciclos anteriores foi 51%."* — falta (precisa de 2 ciclos anteriores) |
| **acabou** | *"Todas as arenas deste ciclo estão fechadas e ainda faltam 5 dias. Se quiser fechar agora, é em Relatórios → Encerrar Ciclo. Deixar rodando também é opção."* — falta |
| **sem ciclo, com volume** | *"Você concluiu 23 ações nas últimas duas semanas, sem ciclo aberto. A rodada acumula a EXP, mas não gera relatório — nada disso fica guardado."* — falta |
| último dia com pendências | existe, e o texto já é bom |
| ciclo no ritmo | existe |

---

### Card

Cinco temas, tom próprio, **não fala dos seus números**: Frases Inspiradoras,
Reflexões Filosóficas, Fragmentos de Sabedoria, Dicas de Vida, Sussurros da
Maestria. Um por dia, com interruptor próprio. Não mexer.

---

### Pedir pacto

Hoje ele escolhe a dificuldade **pelo quanto a arena já andou** e **nunca olha o
ritmo da pessoa**. Quem está com Treino em 60% recebe "entregue em 7 dias
diferentes" — uma semana para quem treina todo dia, quase dois meses para quem
treina 3x por semana. A mesma meta, significados opostos.

O conserto: olhar em quantos dias distintos a pessoa entregou naquela arena nos
últimos 30, e propor algo que caiba. O dado já está na memória.

E cada proposta ganha **uma frase de motivo, tirada do mesmo número que gerou a
escolha**: *"Você registrou Leitura em 4 dos últimos 14 dias — seis ações em duas
semanas cabe nesse ritmo."* Nunca elogio; sempre fato.

---

## A ordem do trabalho

Um passo por vez, parando para mostrar.

1. **O Oráculo enxergar o pacto.** Sem isso, nada abaixo é possível.
2. **Reação do pacto.** Pequena, e é o momento em que a pessoa está olhando.
3. **Fundir as duas listas de assunto em uma**, com dois leitores — a fala de
   abertura lê no app, o card lê no servidor. Hoje os mesmos assuntos estão
   escritos duas vezes e por isso nunca melhoram juntos.
4. **Pedir pacto passa a olhar o ritmo da pessoa.**
5. **Ler meu dia às 20h, no push**, para quem não abriu o app. O ciclo é uma linha
   no banco com data de fim: o servidor calcula "faltam 3 dias e 11 ações" sem
   ninguém abrir nada.

Os dois primeiros são pequenos e dão resultado visível. Do três em diante é obra
maior.

---

## Um defeito de estrutura que precisa sair junto

`buildOracleCycleCoachBrief` é uma **cascata**: o primeiro caso que casa vence e
os de baixo nunca são considerados. Como "atrasado" e "adiantado" estão no meio,
eles capturam quase todo mundo — e qualquer caso novo colocado depois **nunca vai
aparecer**.

Trocar por escolha de relevância, como o árbitro de candidatos já faz. Sem isso,
escrever fala nova é escrever para o vazio.

---

## Como as frases devem ser escritas

1. **Duas medidas, uma contra a outra.** "34 ações e 6 dias; seu melhor dia foram
   3." Medida sozinha é placar, não fala.
2. **Se não dá para nomear o número que gerou a frase, a frase não sai.**
3. **O sujeito é a arena, o ciclo ou o pacto — nunca "você" como culpado.** "A
   arena Meditações ficou pra trás", não "você abandonou Meditações".
4. **A saída é editar o plano, não pedir mais esforço.** Nunca "corra atrás".
   O app já escreve certo em `escopo_pesado`: *"Reduzir meta agora não tira EXP já
   conquistada."*
5. **Convite tem duas portas.** *"Deixar parada é uma escolha válida, desde que
   seja escolha."*
6. **Falar de novo só quando o número muda**, não quando o dia muda.

---

## O que não fazer

- Não criar tabela, tipo de compromisso novo ou modalidade nova de pacto. A que
  falta (dias seguidos) é decisão em aberto e **não entra agora**.
- Não mexer em EXP, na nota do ciclo nem nos modais de recompensa.
- Não fazer fala de abertura ou reação virar notificação no celular. Push é
  assunto separado e depende do servidor.
- Não ressuscitar nada da sequência global. Se sobrar código morto dela, **aponte
  em vez de usar**: `streak_marco` e `streak_em_risco` ainda estão declarados em
  `utils/oracleCandidates.ts` sem nenhum detector, e três estados do servidor
  (`retomando`, `proximo_compromisso`, `primeira_acao_do_dia`) têm frase escrita e
  **nunca são retornados**.
- Não commitar, não publicar, não gerar AAB, não rodar SQL.

---

## Como conferir

`npm run folhas` gera `docs/o-oraculo.html`, que lê o código e mostra o que está
vivo e o que está morto em cada superfície. Rode antes e depois: os números da
folha devem refletir o que você fez.

Mais `npx tsc --noEmit` limpo e as suítes `test:oracle-arbiter`,
`test:oracle-reaction`, `test:oracle-presence-policy`, `test:arena-pacts` e
`test:core-loop`.
