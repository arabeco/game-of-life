# Oráculo — simulação de cinco perfis

Data simulada: 10/09/2026 às 18h. Ciclos de 01 a 14/09. Dados fictícios passam pelo construtor real de contexto e pelas leituras reais do app, sem rede. Os percentuais de entrada são calculados pelas metas e conclusões destes cenários simples; não simulam toda a pontuação do produto.

Cada perfil pede a análise do ciclo cinco vezes, sem mudança nos dados. Entre consultas, a memória de assuntos é atualizada como no painel. Isso permite observar repetição e contradições. Não é validação visual, de notificações ou com usuários reais.

## Achados da simulação

(preencher apos rodar)

## Começando agora

Conta nova, sem Arenas, sem tarefas e sem ciclo.

Dados calculados: {"arenas":0,"completed":0,"planned":0,"progress":null,"expected":null,"pace":null,"pendingToday":0}.

**Ler meu dia**

> Hoje ainda não há atividades registradas no seu planejamento. Se quiser organizar o dia, escolha uma ação que faça sentido para agora.

**Analisar meu ciclo — respostas reais**

1. Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma ação que realmente caiba na sua semana.
   - Botões: Criar primeira arena.
   - Regra: `coach:first-arena`.
   - Estado Mestre: `sem_dados` — ainda nao existe estrutura suficiente para diagnosticar.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:behind, coach:deriva, coach:conta-nao-fecha, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:first-arena` (peso 100 +40 de bônus = 140).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:start-cycle (125, peso menor).

2. Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma ação que realmente caiba na sua semana.
   - Botões: Criar primeira arena.
   - Regra: `coach:first-arena`.
   - Estado Mestre: `sem_dados` — ainda nao existe estrutura suficiente para diagnosticar.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:behind, coach:deriva, coach:conta-nao-fecha, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:first-arena` (peso 100 +40 de bônus = 140).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:start-cycle (125, peso menor).

3. Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma ação que realmente caiba na sua semana.
   - Botões: Criar primeira arena.
   - Regra: `coach:first-arena`.
   - Estado Mestre: `sem_dados` — ainda nao existe estrutura suficiente para diagnosticar.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:behind, coach:deriva, coach:conta-nao-fecha, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:first-arena` (peso 100 +40 de bônus = 140).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:start-cycle (125, peso menor).

4. Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma ação que realmente caiba na sua semana.
   - Botões: Criar primeira arena.
   - Regra: `coach:first-arena`.
   - Estado Mestre: `sem_dados` — ainda nao existe estrutura suficiente para diagnosticar.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:behind, coach:deriva, coach:conta-nao-fecha, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:first-arena` (peso 100 +40 de bônus = 140).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:start-cycle (125, peso menor).

5. Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma ação que realmente caiba na sua semana.
   - Botões: Criar primeira arena.
   - Regra: `coach:first-arena`.
   - Estado Mestre: `sem_dados` — ainda nao existe estrutura suficiente para diagnosticar.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:behind, coach:deriva, coach:conta-nao-fecha, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:first-arena` (peso 100 +40 de bônus = 140).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:start-cycle (125, peso menor).

## Só acompanha treino

Uma Arena, meta de 6 treinos em 14 dias, 4 realizados. Hoje é descanso planejado: não há treino marcado.

Dados calculados: {"arenas":1,"completed":4,"planned":6,"progress":67,"expected":71,"pace":"no_ritmo","pendingToday":0,"trend":"melhorando"}.

**Ler meu dia**

> Hoje ainda não há atividades registradas no seu planejamento. Se quiser organizar o dia, escolha uma ação que faça sentido para agora.

**Analisar meu ciclo — respostas reais**

1. A que mais precisa agora é Treino: 2 ações em 4 dias.
   - Botões: Abrir Treino · Abrir Planner.
   - Regra: `coach:quanto-falta:training-arena-0:2`.
   - Estado Mestre: `estavel` — 67% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:quanto-falta` (peso 60 = 60).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:on-pace (0, peso menor).

2. Você concluiu 4 de 6 ações e esta acompanhando o ritmo do ciclo. Hoje não há atividades pendentes no seu planejamento.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:4`.
   - Estado Mestre: `estavel` — 67% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

3. Você concluiu 4 de 6 ações e esta acompanhando o ritmo do ciclo. Hoje não há atividades pendentes no seu planejamento.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:4`.
   - Estado Mestre: `estavel` — 67% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

4. Você concluiu 4 de 6 ações e esta acompanhando o ritmo do ciclo. Hoje não há atividades pendentes no seu planejamento.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:4`.
   - Estado Mestre: `estavel` — 67% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

5. Você concluiu 4 de 6 ações e esta acompanhando o ritmo do ciclo. Hoje não há atividades pendentes no seu planejamento.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:4`.
   - Estado Mestre: `estavel` — 67% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

## Uso intenso e equilibrado

Cinco Arenas, 80 de 100 execuções. Hoje concluiu 10 atividades e tem 2 pendentes.

Dados calculados: {"arenas":5,"completed":80,"planned":100,"progress":80,"expected":71,"pace":"no_ritmo","pendingToday":2,"trend":"estavel"}.

**Ler meu dia**

> Hoje você concluiu 10 de 12 atividades registradas. Restam 2 atividades no planejamento. Abra o dia e escolha o próximo passo; se algo já não cabe, ajuste o plano.

**Analisar meu ciclo — respostas reais**

1. Boa: você concluiu 80 de 100 ações e esta adiantado. Nesse ritmo, fecha 1 dia antes do prazo.
   - Botões: Ver andamento.
   - Regra: `coach:ahead:10:80`.
   - Estado Mestre: `forte` — 80% feito contra 71% esperado.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:behind, coach:deriva.
   - Assunto: `coach:ahead` (peso 40 +50 de bônus = 90).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (35, peso menor).

2. A que mais precisa agora é Treino: 4 ações em 4 dias.
   - Botões: Abrir Treino · Abrir Planner.
   - Regra: `coach:quanto-falta:heavy-arena-0:4`.
   - Estado Mestre: `forte` — 80% feito contra 71% esperado.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:behind, coach:deriva.
   - Assunto: `coach:quanto-falta` (peso 60 -25 de bônus = 35).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:ahead (90, descansando (2d)).

3. Você concluiu 80 de 100 ações e esta acompanhando o ritmo do ciclo. Há 2 atividades planejadas para hoje ainda por concluir. Você pode rever o dia no Planner.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:80`.
   - Estado Mestre: `forte` — 80% feito contra 71% esperado.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:behind, coach:deriva.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:ahead (90, descansando (2d)).

4. Você concluiu 80 de 100 ações e esta acompanhando o ritmo do ciclo. Há 2 atividades planejadas para hoje ainda por concluir. Você pode rever o dia no Planner.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:80`.
   - Estado Mestre: `forte` — 80% feito contra 71% esperado.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:behind, coach:deriva.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:ahead (90, descansando (2d)).

5. Você concluiu 80 de 100 ações e esta acompanhando o ritmo do ciclo. Há 2 atividades planejadas para hoje ainda por concluir. Você pode rever o dia no Planner.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:80`.
   - Estado Mestre: `forte` — 80% feito contra 71% esperado.
   - Modificadores: nenhum.
   - Proibidos neste estado: coach:behind, coach:deriva.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:ahead (90, descansando (2d)).

## Planejou mais do que executa

Quatro Arenas, meta de 140 execuções em 14 dias, 10 realizadas. Hoje há 8 pendências; o melhor dia teve 2 conclusões.

Dados calculados: {"arenas":4,"completed":10,"planned":140,"progress":7,"expected":71,"pace":"critico","pendingToday":8,"trend":"piorando"}.

**Ler meu dia**

> Hoje você concluiu 0 de 8 atividades registradas. Restam 8 atividades no planejamento. Abra o dia e escolha o próximo passo; se algo já não cabe, ajuste o plano.

**Analisar meu ciclo — respostas reais**

1. Faltam 130 ações e 4 dias. Isso pede 33 por dia, e seu melhor dia até agora foram 2. Reduzir uma meta agora não tira EXP já conquistada.
   - Botões: Abrir Trabalho · Rever ciclo.
   - Regra: `coach:conta-nao-fecha:10:130`.
   - Estado Mestre: `inviavel` — faltam 130 em 4 dia(s): 32.5/dia contra melhor dia de 2.
   - Modificadores: ciclo atrasado (7% contra 71% esperado); ritmo exigido acima do melhor dia (2); 8 pendencias so hoje.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:conta-nao-fecha` (peso 78 +40 de bônus = 118).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:behind (75, peso menor).

2. Seu ciclo esta em 7%, enquanto o tempo percorrido aponta cerca de 71%. Trabalho pede mais atencao agora. Em vez de tentar compensar tudo, escolha uma ação real ou reduza uma meta que deixou de fazer sentido.
   - Botões: Abrir Trabalho · Escolher uma ação.
   - Regra: `coach:behind:overload-arena-2:10`.
   - Estado Mestre: `inviavel` — faltam 130 em 4 dia(s): 32.5/dia contra melhor dia de 2.
   - Modificadores: ciclo atrasado (7% contra 71% esperado); ritmo exigido acima do melhor dia (2); 8 pendencias so hoje.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:behind` (peso 75 = 75).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:conta-nao-fecha (118, descansando (2d)).

3. A que mais precisa agora é Trabalho: 33 ações em 4 dias.
   - Botões: Abrir Trabalho · Abrir Planner.
   - Regra: `coach:quanto-falta:overload-arena-2:33`.
   - Estado Mestre: `inviavel` — faltam 130 em 4 dia(s): 32.5/dia contra melhor dia de 2.
   - Modificadores: ciclo atrasado (7% contra 71% esperado); ritmo exigido acima do melhor dia (2); 8 pendencias so hoje.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:quanto-falta` (peso 60 = 60).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:conta-nao-fecha (118, descansando (2d)).

4. Nada mudou o suficiente para uma leitura nova. Se o dia já está do jeito que você queria, está bom assim.
   - Botões: Abrir Planner.
   - Regra: `coach:sem-leitura:10`.
   - Estado Mestre: `inviavel` — faltam 130 em 4 dia(s): 32.5/dia contra melhor dia de 2.
   - Modificadores: ciclo atrasado (7% contra 71% esperado); ritmo exigido acima do melhor dia (2); 8 pendencias so hoje.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:sem-leitura` (peso -1 = -1).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:conta-nao-fecha (118, descansando (2d)).

5. Nada mudou o suficiente para uma leitura nova. Se o dia já está do jeito que você queria, está bom assim.
   - Botões: Abrir Planner.
   - Regra: `coach:sem-leitura:10`.
   - Estado Mestre: `inviavel` — faltam 130 em 4 dia(s): 32.5/dia contra melhor dia de 2.
   - Modificadores: ciclo atrasado (7% contra 71% esperado); ritmo exigido acima do melhor dia (2); 8 pendencias so hoje.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva, coach:dia-concentrado, coach:volume-x-constancia.
   - Assunto: `coach:sem-leitura` (peso -1 = -1).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:conta-nao-fecha (118, descansando (2d)).

## Mudou o padrão no meio do ciclo

Uma Arena, meta de 20. Fez 10 num único dia no começo e, nos últimos 5 dias, uma por dia sem falhar.

Dados calculados: {"arenas":1,"completed":15,"planned":20,"progress":75,"expected":71,"pace":"no_ritmo","pendingToday":0,"trend":"melhorando"}.

**Ler meu dia**

> Você concluiu a atividade registrada para hoje. O planejamento do dia está em dia. Pode deixar espaço para descansar ou rever o que vem depois.

**Analisar meu ciclo — respostas reais**

1. A que mais precisa agora é Estudo: 5 ações em 4 dias.
   - Botões: Abrir Estudo · Abrir Planner.
   - Regra: `coach:quanto-falta:rhythm-arena-0:5`.
   - Estado Mestre: `estavel` — 75% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:quanto-falta` (peso 60 = 60).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:dia-concentrado (58, peso menor).

2. Dos 15 registros deste ciclo, 10 aconteceram num único dia — 67% do que você fez saiu de uma vez só.
   - Botões: Ver ciclo.
   - Regra: `coach:dia-concentrado:10:15`.
   - Estado Mestre: `estavel` — 75% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:dia-concentrado` (peso 58 = 58).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

3. Nos últimos 5 dias você fez menos por dia do que no começo do ciclo, mas faltou menos dias. Seu volume caiu; sua constância melhorou.
   - Botões: Ver ciclo.
   - Regra: `coach:volume-x-constancia:queda:10`.
   - Estado Mestre: `estavel` — 75% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:volume-x-constancia` (peso 56 = 56).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

4. Você concluiu 15 de 20 ações e esta acompanhando o ritmo do ciclo. Hoje não há atividades pendentes no seu planejamento.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:15`.
   - Estado Mestre: `estavel` — 75% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

5. Você concluiu 15 de 20 ações e esta acompanhando o ritmo do ciclo. Hoje não há atividades pendentes no seu planejamento.
   - Botões: Abrir Planner · Ver ciclo.
   - Regra: `coach:on-pace:10:15`.
   - Estado Mestre: `estavel` — 75% feito contra 71% esperado, sem desvio relevante.
   - Modificadores: dia de hoje sem pendencia.
   - Proibidos neste estado: nenhum.
   - Assunto: `coach:on-pace` (peso 0 = 0).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:quanto-falta (60, descansando (2d)).

## Retomou hoje

Uma Arena, meta de 12 execuções. Fez 3 no início, passou 6 dias sem registrar e voltou hoje com uma conclusão.

Dados calculados: {"arenas":1,"completed":4,"planned":12,"progress":33,"expected":71,"pace":"critico","pendingToday":0,"trend":"retomando"}.

**Ler meu dia**

> Você concluiu a atividade registrada para hoje. O planejamento do dia está em dia. Pode deixar espaço para descansar ou rever o que vem depois.

**Analisar meu ciclo — respostas reais**

1. Você voltou a registrar em Treino depois de 7 dias sem registros. O ciclo segue abaixo do planejado. Você pode rever a meta sem tentar compensar toda a pausa hoje.
   - Botões: Abrir Treino · Abrir Planner.
   - Regra: `coach:retomada:return-arena-0:10`.
   - Estado Mestre: `retomando` — Treino voltou apos 7 dias parada.
   - Modificadores: ciclo atrasado (33% contra 71% esperado); ritmo exigido acima do melhor dia (1); retomada em Treino apos 7 dias; dia de hoje sem pendencia.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva.
   - Assunto: `coach:retomada` (peso 55 +60 de bônus = 115).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:conta-nao-fecha (78, peso menor).

2. Faltam 8 ações e 4 dias. Isso pede 2 por dia, e seu melhor dia até agora foi 1. Reduzir uma meta agora não tira EXP já conquistada.
   - Botões: Abrir Treino · Rever ciclo.
   - Regra: `coach:conta-nao-fecha:10:8`.
   - Estado Mestre: `retomando` — Treino voltou apos 7 dias parada.
   - Modificadores: ciclo atrasado (33% contra 71% esperado); ritmo exigido acima do melhor dia (1); retomada em Treino apos 7 dias; dia de hoje sem pendencia.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva.
   - Assunto: `coach:conta-nao-fecha` (peso 78 = 78).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:retomada (115, descansando (1d)).

3. A que mais precisa agora é Treino: 8 ações em 4 dias.
   - Botões: Abrir Treino · Abrir Planner.
   - Regra: `coach:quanto-falta:return-arena-0:8`.
   - Estado Mestre: `retomando` — Treino voltou apos 7 dias parada.
   - Modificadores: ciclo atrasado (33% contra 71% esperado); ritmo exigido acima do melhor dia (1); retomada em Treino apos 7 dias; dia de hoje sem pendencia.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva.
   - Assunto: `coach:quanto-falta` (peso 60 = 60).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:retomada (115, descansando (1d)).

4. Seu ciclo esta em 33%, enquanto o tempo percorrido aponta cerca de 71%. Treino pede mais atencao agora. Em vez de tentar compensar tudo, escolha uma ação real ou reduza uma meta que deixou de fazer sentido.
   - Botões: Abrir Treino · Escolher uma ação.
   - Regra: `coach:behind:return-arena-0:10`.
   - Estado Mestre: `retomando` — Treino voltou apos 7 dias parada.
   - Modificadores: ciclo atrasado (33% contra 71% esperado); ritmo exigido acima do melhor dia (1); retomada em Treino apos 7 dias; dia de hoje sem pendencia.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva.
   - Assunto: `coach:behind` (peso 75 -20 de bônus = 55).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:retomada (115, descansando (1d)).

5. Nada mudou o suficiente para uma leitura nova. Se o dia já está do jeito que você queria, está bom assim.
   - Botões: Abrir Planner.
   - Regra: `coach:sem-leitura:10`.
   - Estado Mestre: `retomando` — Treino voltou apos 7 dias parada.
   - Modificadores: ciclo atrasado (33% contra 71% esperado); ritmo exigido acima do melhor dia (1); retomada em Treino apos 7 dias; dia de hoje sem pendencia.
   - Proibidos neste estado: coach:on-pace, coach:ahead, coach:deriva.
   - Assunto: `coach:sem-leitura` (peso -1 = -1).
   - Venceu porque: maior peso final entre os permitidos e acordados; o proximo era coach:retomada (115, descansando (1d)).
