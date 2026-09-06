# O Oráculo do Glyph — resumo para conversar fora do código

Escrito para ser colado num chat que **não tem acesso ao repositório**. Tudo aqui
foi verificado no código em 05/09/2026.

---

## 1. O que é o app

**Glyph** é um app de organização e registro da própria vida, com camada de RPG.
A pessoa cria **arenas** (frentes da vida: Treino, Estudo, Trabalho, Casa),
dentro delas **ações**, e agenda **tarefas** no planner. Ao concluir, ganha EXP
proporcional à duração × dificuldade, sobe de patente, ganha ouro, fragmentos,
baús e itens cosméticos. Há **ciclos** (períodos com duração escolhida pela
pessoa, que geram relatório e nota) e **rodada** (o modo sem ciclo).

O dia vira às **4h da manhã** ("dia operacional"). O dia fecha sozinho e deposita
a EXP **em silêncio** — o app nunca anuncia o fecho do dia.

**Os três motivos pelos quais alguém usaria**, segundo o dono do produto:
1. ver todas as suas arenas juntas, quase fisicamente;
2. acompanhar metas e dados;
3. se achar — dopamina, perfil, quests.

A leitura de trabalho: **1 e 2 são o valor; 3 é o motor** que faz 1 e 2 acontecerem.

---

## 2. O que é o Oráculo

Uma presença de IA dentro do app que comenta, orienta e conversa. Hoje ele tem
**quatro papéis diferentes** que costumam ser confundidos:

| parte | o que faz |
|---|---|
| **Card automático** | um conteúdo curto do dia, gerado por IA, que pode virar notificação |
| **Fala de abertura / orientação** | quando você abre uma tela, ele comenta o estado do ciclo, arenas atrasadas, prioridade |
| **Reação** | comenta a ação que você acabou de concluir, ou um marco (arena/campanha fechada) |
| **Chat** | conversa livre, e é onde a pessoa pede um "pacto" (compromisso voluntário) |

### Os controles que existem

- **Presença** (o quanto ele fala), com três níveis:
  - **Silencioso** — *"Só o essencial. Ele fala quando você chama."* Sem card, sem fala de abertura, sem reações.
  - **Equilibrado** — *"Um card e uma fala por dia, e ele celebra quando você fecha algo grande."* Reações só em marcos.
  - **Presente** — *"Fala toda vez que você abre e acompanha o seu dia de perto."* Todas as reações.
- **Tom** (como ele escreve a mesma coisa): Neutro (padrão), Coach, Reflexivo, Calmo. Os três últimos são premium.
- **Modo** (legado, se sobrepõe ao tom): neutro, calmo, reflexivo, tático, estratégico, coach, personalizado.
- **Avisos no aparelho** (push), com interruptores separados.

### Como ele decide o que falar

Existe um sistema de **candidatos**: 14 assuntos possíveis, cada um detectado por
uma regra sobre os dados, cada um com peso. Um árbitro escolhe **no máximo um**, e
**o silêncio é uma resposta válida**. Os 14 são:

`streak_marco`, `streak_em_risco`, `meta_inflada`, `ausente`, `arena_retomada`,
`sem_ciclo`, `ciclo_longo`, `sem_entrega`, `arena_atrasada`, `arena_parada`,
`ciclo_atrasado`, `prioridade`, `ja_entregou`, `estrutura_enxuta`.

O contexto que ele recebe já é **muito mais rico do que as falas usam**: existência
e datas do ciclo, dias restantes, progresso real vs. esperado, ritmo, contagens
por arena, pendências do dia, atrasos, demanda diária planejada, melhor volume já
registrado, dias ativos, prioridades e próximo movimento. Há também comparação
com ciclos anteriores e uma nota de ciclo ("fair score") que já considera cadência
pessoal e compromissos honrados.

---

## 3. Limites técnicos reais

- O servidor grava **no máximo 12 mensagens do Oráculo por dia civil** — acima
  disso ele responde "pulado por teto diário". Note: **dia civil**, não o dia
  operacional das 4h. Os dois não estão alinhados.
- **Push só sai para conteúdo classificado como "feed"**. Fala de abertura e
  reação são gravadas como "chat" e **nunca** viram notificação. Pedido manual
  também não.
- A memória de "sobre o que ele já falou" vive no **localStorage**, ou seja, **não
  sincroniza entre aparelhos**.
- O app **não sabe** o que aconteceu na vida da pessoa. Sabe só o que foi
  registrado. Registro vazio **não prova** descanso nem abandono — e a linguagem
  dele precisa respeitar isso.

---

## 4. Os problemas que a gente encontrou

### 4.1 A sequência ("streak") é culpa pura

O app tem uma sequência diária global: registre pelo menos uma ação por dia, todo
dia, ou ela volta a zero. Ela:

- é **invisível** — não existe nenhuma tela que mostre "você tem N dias";
- só aparece **quando o Oráculo avisa que você vai perdê-la**;
- paga uma única vez (300 EXP + 2 de ouro, aos 5 dias);
- **exige dias consecutivos** e nunca consulta se havia descanso planejado;
- roda **no cliente**, então quem não abre o app não avança nem quebra;
- e **descarta registro retrospectivo**: se você marcou hoje uma tarefa de ontem,
  não conta.

Ou seja: **o app tem o custo psicológico de uma sequência e nenhum dos benefícios.**

### 4.2 Ela pune comportamento correto

Simulação de 30 dias com três pessoas:

| | Ana (turno irregular, registra em lote) | Bruno (seg–sex, registra na hora) | Clara (10 min todo dia) |
|---|---:|---:|---:|
| fez de verdade | **1.440 min** | 660 min | 300 min |
| EXP no fim | **720** | 1.260 | **900** |
| sequência | **0** | 2 (melhor: 5) | 30 |

**Ana faz 4,8× mais que Clara e termina com 20% menos EXP.** Bruno é punido por
descansar no fim de semana, que é o programa correto dele.

E tem uma inconsistência dentro do próprio app: **a EXP de registro atrasado É
reconciliada** (existe um mecanismo que re-pontua o dia já fechado e ajusta o
depósito). **A sequência não é.** O app já tem a máquina de honrar registro
tardio; só não a aplicou na sequência.

### 4.3 A versão boa da mecânica já existe e ninguém usa

O app já tem **pactos de arena** — compromissos **voluntários**, ligados a uma
arena, que a pessoa aceita pelo chat do Oráculo. Três tipos: *constância*,
*conclusão*, *retomada*. Três dificuldades, pagando 2/5/10 de ouro + 100/300/500
EXP (o mais alto ainda dá um baú Raro).

E o texto do pacto de constância diz literalmente:

> *"Conclua ao menos uma ação de {arena} em N dias diferentes. **Não precisam ser
> seguidos.**"*

Ou seja: **o app já tem uma sequência que perdoa descanso, é opt-in, é por arena e
paga mais.** A sequência global é a versão ruim da mesma coisa.

### 4.4 Um bug de entrega, já consertado

A elegibilidade do card automático estava decidida em **dois lugares com respostas
diferentes**: o servidor deixava o nível "Equilibrado" passar, o cliente exigia
"Presente". Quem estava no Equilibrado recebia o card por push e **nunca** pelo
caminho local. Já corrigido e coberto por teste.

Ainda sobra outra divergência na mesma função: o servidor tem um atalho por
"modo legado" que o cliente não tem.

---

## 5. As decisões tomadas

1. **A sequência global sai.** Não vira semanal, não ganha congelamento, não ganha
   moeda diária. Sai como cobrança.
2. **O que sobra é o pacto**: se a pessoa quer ritmo diário, ela **aceita** um
   compromisso e é cobrada disso. Quem não aceitou nada não é cobrado de nada.
3. **O nome é "pacto"**, não "desafio" nem "missão" — as duas outras palavras já
   significam coisas diferentes no app ("desafio" é duelo contra um rival;
   "missão" é quest de temporada).
4. **A primeira coisa a construir não é mecânica nenhuma: é mostrar o progresso
   que já é calculado e não aparece.** O app já computa "faltam 5 de 12" e não
   mostra isso onde a pessoa registra. Vai virar `5/7` acima da barra da arena e
   um toast no momento do registro.
5. **Não mexer em EXP, na nota do ciclo, nem na economia** enquanto isso.

---

## 6. As perguntas que continuam abertas

1. **Por que alguém acha bom anotar?** Anotar custa **agora**; o valor chega
   **depois**. Essa defasagem é o problema central do produto, e a sequência era
   uma tentativa ruim de pagá-la. Qual é a boa?
2. **Tirando a sequência, o Oráculo fica sem nada urgente pra dizer.** Um
   comentário no código argumenta que a sequência era *"a única coisa no app que
   morre sozinha se ninguém disser nada"*. Isso é perda ou é o ponto?
3. **Uma sequência que perdoa descanso é um motor fraco?** A do Duolingo funciona
   *porque* é dura. Se o valor do Glyph é atração (o quadro valer a pena ser
   olhado) e não empurrão, dá pra sustentar retorno sem pressão?
4. **Pagar por conclusão auto-relatada compra poluição do próprio dado?** O
   caminho barato de "farmar" é arrastar uma ação existente e marcar como feita —
   3 segundos — e isso suja o relatório e a nota que a pessoa veio ver. Existem
   contenções (ações "Livre" não pontuam, teto de ouro no ciclo), mas o incentivo
   existe.
5. **Falta uma modalidade de pacto**: "6 ações em 14 dias", volume com prazo, em
   que descanso não quebra nada. É o caso de quem treina espaçado e de quem
   trabalha em turno.

---

## 7. Se você for pedir opinião a um chat, pergunte isto

- Um app de registro de vida deve ter sequência diária? Se não, o que substitui
  como razão de voltar?
- Como fazer o **ato de registrar** valer a pena no instante em que acontece, e
  não vinte minutos depois?
- Uma IA dentro de um app assim: quando ela deve **calar**? O que a torna útil em
  vez de ruído?
- Qual a diferença entre premiar **a vida da pessoa** e premiar **o hábito de usar
  o app** — e como não confundir os dois?
