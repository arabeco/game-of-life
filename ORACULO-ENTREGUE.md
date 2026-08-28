# Oráculo — o que foi construído

Relatório de execução do plano de 8 itens. **Autocontido**: quem ler isto não
precisa do repositório.

Contexto para quem chega agora: o Glyph é um app de produtividade (React/TS +
Capacitor Android sobre Supabase). O "Oráculo" é a camada que fala com a pessoa.
Toda fala vem de bancos de frases escritos à mão e escolhidos no aparelho —
**zero chamada de modelo, egress zero**, e isso é requisito, não acaso: o custo
cresceria com cadastros e não com receita.

Os 8 itens estão **todos implementados, testados e commitados**. Nada foi
publicado ainda: o app na loja está na 1.0.78 e não contém nada disto.

---

## O diagnóstico que gerou o plano

O Oráculo já tinha muita percepção e jogava quase tudo fora:

- O contexto calculava **16 campos por arena, para até 6 arenas ranqueadas**,
  com `pace` de 5 estados e um `suggestedAdjustment` de 5 valores.
- A fala lia **14 campos**, e **um só** era por arena: `arenaSignals[0]`.
- **Nenhum campo de streak era lido.** O app tinha 4 e usava 0.

E decidia por uma **cascata de 10 `if`**: o primeiro que casasse vencia e calava
os outros nove.

Pior: as arenas eram ranqueadas **por gravidade**, com multiplicador de 1000 no
`suggestedAdjustment`. Isso significa que `adiantado + manter_ritmo` dá a menor
nota possível — era **estruturalmente impossível** uma arena que vai bem ganhar
a voz, e uma virada **caía** no ranking justamente por ter melhorado.

---

## 1. Candidatos + árbitro no lugar da cascata

Sete detectores independentes produzem candidatos; ninguém cala ninguém. O
árbitro ordena por relevância.

A pergunta mudou de *"qual arena está pior?"* para *"qual acontecimento merece
ser dito agora?"* — e, antes dela, *"alguém merece falar?"*.

### Três decisões que o teste protege

**Lista ranqueada, não vencedor.** Quem consome anda na lista. Se devolvesse só
o primeiro, um candidato barrado adiante (cooldown, frase inválida por variável
faltando) viraria silêncio indevido em vez de passar a vez. Isso foi decidido no
item 1 sem consumidor existente — o consumidor chegou no item 5.

**Silencioso é `Infinity`, não um número alto.** É o pacto, não uma régua
severa. Nenhum acontecimento fura por acidente.

**Sem candidato, silêncio.** O direito de não falar é resposta válida.

### O risco que essa troca cria, e como foi coberto

Trocar 10 `if` legíveis por 14 tipos × 4 números = **56 constantes ajustadas à
mão** pode produzir uma regra ruim **e** opaca — pior que a cascata. Duas
condições foram impostas antes de fazer a troca:

1. **Tabela única de pesos**, com um campo `why` obrigatório por tipo — o teste
   falha se faltar.
2. **Teste de fixture escrito ANTES do módulo**, que pina os comportamentos
   (quem vence em cada cenário), não os números. É o que permite recalibrar sem
   quebrar o resto.

### A tabela de pesos (o artefato mais revisável deste documento)

Fórmula: `importância×1,0 + urgência×1,5 + novidade×1,2 + acionabilidade×0,8`

Urgência pesa mais porque **é o único eixo que expira**. O que é importante hoje
continua importante amanhã; o que é urgente, não.

| tipo | imp | urg | nov | ação | cooldown | nota |
|---|---|---|---|---|---|---|
| `streak_em_risco` | 4 | 5 | 3 | 5 | 0 | **19,1** |
| `meta_inflada` | 5 | 3 | 4 | 5 | 3 | 18,3 |
| `ausente` | 4 | 5 | 3 | 3 | 1 | 17,5 |
| `sem_ciclo` | 4 | 3 | 2 | 5 | 1 | 14,9 |
| `sem_entrega` | 4 | 4 | 2 | 3 | 1 | 14,8 |
| `arena_retomada` | 4 | 2 | 5 | 2 | 2 | 14,6 |
| `arena_parada` | 4 | 3 | 2 | 4 | 2 | 14,1 |
| `streak_marco` | 4 | 3 | 4 | 0 | 0 | 13,3 |
| `prioridade` | 2 | 3 | 1 | 5 | 1 | 11,7 |
| `ciclo_longo` | 3 | 2 | 2 | 4 | 3 | 11,6 |
| `ciclo_atrasado` | 3 | 3 | 1 | 2 | 2 | 10,3 |
| `arena_atrasada` | 3 | 2 | 1 | 3 | 2 | 9,6 |
| `estrutura_enxuta` | 2 | 1 | 3 | 3 | 3 | 9,5 |
| `ja_entregou` | 2 | 1 | 2 | 0 | 0 | 5,9 |

Mais um **boost de gravidade**, limitado a **+2,0**, que ordena arenas *dentro*
do mesmo tipo (entre três atrasadas, a pior fala primeiro). O teto existe para
que ele desempate sem promover: 2 pontos é menos que a distância entre dois
tipos vizinhos.

**O corte por presença:** Silencioso `∞` · Equilibrado `10` · Presente `5`.
É isso que faz elogio de rotina (5,9) passar no Presente e não no Equilibrado —
a diferença entre "acompanha o seu dia de perto" e "celebra o que é grande".

### Uma mudança concreta de comportamento

Na cascata, `arena_atrasada` vinha **antes** de `prioridade`. Quem tinha uma
arena levemente atrasada nunca ouvia qual era a próxima ação concreta. Agora
`prioridade` (11,7) ganha de `arena_atrasada` (9,6 + boost ≤ 2 = 11,6): apontar
o próximo movimento vale mais que anunciar um atraso que a pessoa já vê na tela.

---

## 2. `trend` — direção, separada de posição

`pace` responde *onde ela está em relação ao planejado*. `trend` responde *para
onde ela está indo*. **Não cabem no mesmo campo.**

`piorando` · `estavel` · `melhorando` · `retomando`

Uma arena pode estar em 22% quando deveria estar em 60% — `critico` — **e ao
mesmo tempo** ter voltado a andar hoje depois de 8 dias parada.

- Antes: *"Projeto está crítico. Reduza a meta."* No exato dia em que a pessoa
  fez a coisa certa.
- Agora: *"Depois de 8 dias parada, Projeto voltou a andar. Ainda está atrás,
  mas mudou de direção."*

A retomada **substitui** a queixa sobre a mesma arena. Os dois fatos são
verdade; só um merece a fala. E a frase não finge que está tudo bem —
reconhecer não é bajular.

### Sem tabela nova

As tasks já têm data operacional, então **o passado é o mesmo cálculo com outra
data de corte**. Quatro janelas derivadas (hoje / ontem / D-3 / D-7), zero
migração, zero snapshot para manter.

Dois cortes que importam:

- **Pausa mínima de 4 dias** para contar como retomada. Menos que isso é fim de
  semana — sem esse corte, toda segunda-feira o app anunciaria uma volta heroica.
- **Melhorar dentro do ritmo não vira fala.** Melhorar é o esperado; só a volta
  depois de pausa real é novidade.

O tamanho da pausa volta junto do estado, porque *"voltou depois de oito dias"*
é uma frase e *"voltou"* é um adjetivo.

---

## 3. `meta_inflada` separado de execução baixa

O app tinha um diagnóstico só: `reduzir_meta`, que dispara em `pace atrasado`.
Isso acontece tanto para quem pôs 2 ações/dia e não fez, quanto para quem pôs 40
e é impossível. **Só o segundo é evidência de estrutura errada.**

E as frases mandavam cortar nos dois casos: *"reveja a meta"*, *"diminua a
repetição"*, *"talvez a meta é que estava grande"*. Se você pôs 2 por dia e
passou a semana no videogame, não há nada de errado com o número — **o app
estava se rendendo por você**.

Agora são dois. `arena_atrasada` é execução, e a fala voltou para o que cabe:
*"Abra {arena} e feche uma ação dela hoje. A menor que tiver."*

`meta_inflada` é estrutura, e passa por **quatro portões conservadores**:

| | |
|---|---|
| 5 dias de ciclo | antes disso não há o que julgar |
| 3 dias com entrega | separa "impossível" de "nem tentou" |
| 8 ações/dia de piso absoluto | abaixo disso nenhuma estrutura é impossível |
| demanda > **dobro** do melhor dia já entregue | o teste de verdade |

O melhor dia é generoso de propósito: se nem ele chega perto do que o plano pede
todo dia, a conta não fecha e a culpa é do número.

Isso porque **falso positivo aqui manda alguém capaz baixar o próprio padrão**,
o que é pior do que ficar calado.

`meta_inflada` tem nota 18,3, acima de "sumiu" (17,5), de propósito: uma
estrutura impossível costuma ser **a causa** de ter sumido. A causa fala antes do
sintoma.

> *"São 40 ações por dia aí. Não é você que está devendo — é o número."*

Nenhuma das 8 linhas cobra ou pede esforço. Todas apontam o número.

---

## 4. Streak com voz, e aviso antes de morrer

**Nenhuma das ~200 linhas do app mencionava o streak.** O que mais segura a
pessoa era a única coisa que o Oráculo não comentava.

E o streak é **lazy**: só é reavaliado quando a pessoa conclui algo. Nada rodava
quando ela *não* fazia nada — que é exatamente quando ele morre.

Duas metades:

**Cliente.** Quem abre o app depois das 18h com streak ≥ 3 e nada entregue hoje
ouve o número. Passa pela presença, como todo comentário. (A madrugada continua
contando: o dia operacional vira às 4h.)

**Cron.** Segunda varredura 21h–23h, população própria, dedupe por dia. Custa
**uma leitura de perfil por pessoa** — `daily_proof_streak` já guarda a sequência
e a data da última entrega, então não varre task nenhuma.

### O Silencioso não foi furado

Dois interruptores, e é uma distinção conceitual, não uma conveniência:

| | |
|---|---|
| **Presença** | o que o Oráculo **comenta** |
| **Alertas importantes** | perda iminente — independe da presença |

Abrir exceção invisível no Silencioso transformaria preferência em sugestão, e a
pessoa descobriria que o desligado não desligava. **Silencioso + Alertas ligados**
vira combinação legítima, hoje impossível de expressar. Nasce **desligado**: o
texto do Silencioso diz *"Só o essencial"*, e ninguém lendo aquilo entende que
vai receber notificação.

### Um bug que teria falhado em silêncio

O portão de push teria matado o aviso de **três formas**: `presenceLevel <= 0`
barra o Silencioso — justamente quem o interruptor existe para servir — e depois
o perfil de modo exige `presentation === 'info_card'` ou recusa tudo. A mensagem
seria gravada no histórico e **nunca chegaria ao celular**, sem erro nenhum.
Agora `purpose: 'streak_alert'` tem saída própria, antes do portão de presença.

**Limitação registrada:** o servidor tem `America/Sao_Paulo` chumbado e não há
fuso por usuário. Correto hoje (base 100% Brasil); quebra no primeiro usuário
fora. Dívida anotada, não bloqueio.

---

## 5. Memória curta

Cada fala nascia só do estado de **agora**. Ele nunca soube que tinha dito a
mesma coisa ontem. Sem memória não existe amizade — um cartaz também descreve
seu estado; o que separa os dois é reconhecer percurso.

O efeito prático é mais bobo e mais grave do que parece: quem está em
`prioridade` fica em `prioridade` por semanas. Com 2 variações, a pessoa via as
duas 3 vezes numa semana. Nesse ponto ela para de ler.

**Duas regras, e são diferentes:**

- **Cooldown** — por quantos dias o **assunto** fica de fora. Mora na tabela de
  pesos porque é propriedade do tipo: *queixa cansa, risco não*. É **por arena**:
  reclamar de Projeto não cala Saúde.
- **Não repetir** — a mesma **frase** nunca sai duas vezes seguidas, nem quando o
  assunto volta legitimamente.

O assunto de molho **passa a vez** em vez de virar silêncio — é para isso que o
árbitro devolve lista.

Tudo função pura sobre uma lista; `localStorage` só nas duas pontas, falhando em
silêncio. Sem memória o Oráculo volta a ser o que era: pior, não quebrado.

---

## 6. Marcos e viradas

**Marcos 7/14/30/60/100** ganharam fala própria. Sem eles o número não significa
nada: se o dia 30 chega com a frase do dia 12, o acumulado nunca vira acumulado.

É a **única entrada do banco que só oferece** — não pede ação, não aponta próximo
passo, não lembra do que falta. Pedir algo ali estragaria o único momento do app
em que a pessoa não deve nada a ninguém.

O peso cresce com o tamanho, e a base foi **baixada** para que isso decidisse:
novidade 4 e não 5, porque **marco é previsível** — quem está no dia 6 sabe que
amanhã é 7, enquanto uma retomada surpreende. Assim o dia 100 ganha de uma arena
parada há 9 dias e o dia 7 perde.

**A ausência virou volta.** As linhas diziam *"você não abre o Planner há 5
dias"* para alguém que estava **com o Planner aberto na mão** — o mesmo erro de
mandar cortar meta no dia certo: comentar o passado e ignorar o único fato novo.
Quem está lendo aquilo voltou. O número de dias fica, porque reconhecer o
intervalo é diferente de fingir que ele não existiu.

E o contador de dias consecutivos, exposto sem consumidor no item 5, agora
carrega a **segunda noite seguida** no limite. Entra como variável de frase: na
primeira vez vale `null` e o preenchedor invalida sozinho as linhas que a usam.
A variação não existe até existir — sem um `if` a mais.

---

## 7. Gramática do háptico

As 10 pistas escolhiam a própria vibração no lugar onde eram tratadas, e
colidiam:

| colidia com | |
|---|---|
| marcar uma ação | fechar um dia de sequência |
| fechar uma arena | fechar o painel diário |
| **fechar um ciclo inteiro** | **fechar o painel diário** |

Escolha espalhada não consegue garantir que coisas diferentes sejam diferentes,
porque cada linha só vê a si mesma. Agora o peso sai de uma tabela e o tratador
só traduz.

**O corpo aprende por diferença, e é o corpo que gera antecipação.** A regra tem
duas metades: *a mesma coisa sempre vibra igual; coisas diferentes nunca vibram
igual.*

Quatro pesos: **toque** (dezenas de vezes por dia) · **fecho** (algo terminou) ·
**marco** (poucas vezes por mês) · **marco_raro**, exclusivo dos marcos de
sequência, com desenho **oposto** ao do nível: começa longo e **afina** em vez de
crescer. Duas coisas grandes que sobem igual são a mesma coisa para o pulso.

O confete deixou de acompanhar o pulso: ele responde ao que merece a **tela**, e
nem tudo que merece o pulso merece a tela.

---

## 8. Repertório

**112 → 176 aberturas**, e não por igual. O cooldown já era a medida de
frequência, então é ele que decide: cooldown 0–1 → 4 linhas por tom; cooldown 2
→ 3; cooldown 3 → 2.

Precisava mesmo: com 2 linhas e a memória impedindo repetir a anterior, a escolha
deixa de ser sorteio e vira **alternância** — detectável em 4 exposições.

O teste passa a exigir o mínimo por faixa e mais duas coisas que a contagem
sozinha não pega: **nenhuma linha repetida** dentro do mesmo estado/tom, e
**nenhuma frase compartilhada entre dois tons** — se duas vozes dizem a mesma
coisa, uma delas não existe, e três das quatro são pagas.

---

## O que o código pegou que o plano não previa

**1. `reduzir_meta` não detectava estrutura inflada.** Detectava atraso. A causa
nunca era distinguida — o item 3 era maior do que o plano supunha.

**2. O ranking punia quem melhora.** Não era só "a virada é invisível por falta
de memória": ela era **desclassificada** pelo ranking por ter melhorado. Dois
mecanismos, não um.

**3. Uma celebração estava desligada há meses.** O modal de conquista reconhecia
a missão de sequência comparando com o texto `'Sete Dias em Movimento'`, escrito à
mão. Quando o desafio caiu de 7 para 5 dias, o nome mudou na fonte de dados e o
literal ficou. A comparação virou sempre falsa: quem fechava a sequência recebia
o *"Desafio concluído"* genérico, e a celebração escrita para o momento nunca
apareceu para ninguém.

**4. Um padrão de teste que esconde bugs.** O teste que existia para pegar o item
3 acima pinava a frase `'SETE DIAS REAIS!'`. Quando o texto foi reescrito, ele
falhou **sem apontar causa** e virou "teste velho" por meses. Três testes desta
leva tinham o mesmo defeito. Regra adotada: **teste que pina redação vira ruído;
teste que pina ligação pega bug.** E âncoras de `indexOf` são conferidas antes do
slice — um `-1` silencioso já tinha esvaziado uma asserção que seguia "passando".

**5. O portão de push mataria o item 4 em silêncio** (descrito acima).

---

## O que NÃO foi feito, de propósito

- **Push diário de engajamento.** *"Sentimos sua falta"* é o que faz desinstalar.
  O único push novo é perda iminente, com opt-in explícito.
- **Mascote com nome, rosto e humor.** A pessoa registra o que quer virar. Um
  personagem fazendo piada quando ela falhou três dias é humilhante.
- **Elogio inflacionado.** `ja_entregou` tem nota 5,9 de propósito.
- **Chamar modelo para gerar fala.** Custo cresceria com cadastros, não com
  receita.

---

## Onde um segundo olhar vale mais

**1. A calibragem dos pesos.** A tabela acima é a parte mais arbitrária de tudo.
Duas ordenações em particular foram decididas no braço e o teste apenas as
congela:

- `streak_em_risco` (19,1) acima de `meta_inflada` (18,3) — a sequência morre
  hoje, a conta continua não fechando amanhã.
- `meta_inflada` (18,3) acima de `ausente` (17,5) — a causa antes do sintoma.

Margens de menos de 1 ponto. São defensáveis, mas não são medidas.

**2. Os quatro eixos poderiam ser três.** `importância` e `novidade` correlacionam
mais do que eu gostaria na tabela final. Não achei um caso onde separá-los mudou
a decisão.

**3. Cooldown como proxy de frequência.** Funcionou para dimensionar o repertório,
mas já tem uma exceção declarada (`streak_marco`: cooldown 0 e frequência
baixíssima). Uma exceção em 14 é aceitável; duas sugeririam que a métrica está
errada.

**4. Nada foi validado com usuário.** Todo comportamento aqui é raciocínio +
teste de fixture. Nenhuma das 176 linhas foi lida por alguém que não seja o
autor, e o app com essas mudanças ainda não rodou em nenhum aparelho.

---

## Números

| | |
|---|---|
| Tipos de candidato | 14 (era: cascata de 10 `if`) |
| Detectores independentes | 8 |
| Linhas de abertura | **176** (era 112) |
| Linhas de reação | 120 (inalterado) |
| Tons | 4 (1 grátis, 3 pagos) |
| Campos por arena calculados | 17 (16 + `trend`) |
| Campos por arena **usados na fala** | **todos** (era: 1) |
| Campos de streak usados | 2 (era: 0) |
| Pesos hápticos | 4 (era: escolha solta por pista) |
| Egress por fala | **zero** |
| Migrações novas | 1 (uma coluna + índice parcial) |
| Suítes de teste verdes | 5 |
