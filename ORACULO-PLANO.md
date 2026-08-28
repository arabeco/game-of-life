# Oráculo — o plano

Substitui a ordem das Partes 5 e 9 do [ORACULO-FASE-4.md](ORACULO-FASE-4.md).
O diagnóstico daquele documento continua valendo; o que muda é **por onde
começar**, e a resposta virou outra.

**A frase que resume:** o Oráculo não deve procurar o maior problema da pessoa.
Deve procurar a **mudança mais significativa na trajetória** dela.

---

## O que ficou claro nas três rodadas

Eu comecei propondo escrever mais frases. Estava errado.

O banco tem 80 aberturas e 120 reações. **O gargalo não é linguagem, é
seleção** — as frases certas não chegam na situação certa. Escrever mais 200
antes de consertar isso seria encher um cano entupido.

O que o código revelou, em ordem de gravidade:

**1. A cascata cala tudo.** Dez `if`, o primeiro que casar vence e silencia os
outros nove. Uma pessoa pode estar simultaneamente 3 dias ausente, com o ciclo
atrasado, uma arena crítica, outra retomada, no streak 29 e tendo acabado de
concluir algo. A cascata decide: `ausente` ganhou, fim. A vida não tem
prioridade fixa.

**2. O ranking pune quem melhora.** As arenas são ordenadas por gravidade, com
multiplicador de 1000 no `suggestedAdjustment`. `adiantado` + `manter_ritmo` é a
menor nota possível. **É estruturalmente impossível uma arena que vai bem ganhar
a voz** — e uma virada *cai* no ranking por ter melhorado. Depois só a primeira
sobrevive: calcula 6, joga 5 fora.

**3. `reduzir_meta` mistura duas coisas opostas.** Ele dispara em `pace atrasado`
— que acontece tanto para quem pôs 2 ações/dia e não fez, quanto para quem pôs
40 e é impossível. **Só o segundo é evidência de estrutura errada.** O primeiro
é execução baixa, e sugerir "reduza a meta" ali é o app se rendendo por você.

**4. O streak é lazy.** Só é reavaliado quando a pessoa conclui algo. Nada roda
quando ela *não* faz nada — que é exatamente quando o streak morre.

---

## A arquitetura

Trocar `focusArena + cascata` por **candidatos + árbitro**.

```
DETECTORES                    cada um produz candidatos independentes,
                              nenhum silencia o outro
  detectAbsence()
  detectCycleIssues()
  detectArenaIssues()         ← por arena, TODAS, não só a pior
  detectArenaTransitions()    ← precisa de trend
  detectStreakEvents()
  detectStructuralIssues()    ← meta_inflada
  detectAchievements()        ← viradas, marcos, consistência
        ↓
  OracleCandidate[]
        ↓
SCORE       importance · urgency · novelty · actionability
        ↓
CORTE       presença define o mínimo
        ↓
MEMÓRIA     cooldown, não-repetição
        ↓
DECISÃO     o melhor sobrevivente fala — ou ninguém fala
```

### A pergunta muda

| Hoje | Depois |
|---|---|
| Qual arena está pior? | Qual acontecimento merece ser dito agora? |
| Quem ganhou a cascata? | **Alguém merece falar?** |

### Por que 4 dimensões e não uma nota

Discutir "streak em risco é 4 ou arena concluída é 4?" é insolúvel, porque as
duas são importantes **por motivos diferentes**:

| Candidato | imp | urg | nov | ação |
|---|---|---|---|---|
| Arena concluída | 4 | 1 | 2 | 0 |
| Streak 23 em risco | 3 | **5** | 3 | **5** |
| Projeto voltou depois de 8 dias | 4 | 2 | **5** | 2 |
| 40 ações planejadas por dia | **5** | 3 | 4 | **5** |

A arena já foi fechada e vai continuar fechada daqui a 20 minutos. O streak
pode morrer. **Relevância é quanto vale interromper, não tamanho da conquista.**

### O direito de não falar

O árbitro pode devolver ninguém. Se o melhor candidato é medíocre, silêncio.

Isso protege o que o banco já acerta: elogio inflacionado destrói o valor do
elogio de marco. Um bom Oráculo não é o que sempre acha o que dizer — é o que,
quando fala, faz a pessoa pensar *"é verdade"*.

---

## `trend`: a peça que faltava

`pace` e direção são **dimensões diferentes** e não cabem no mesmo campo:

- **`pace`** — onde ela está em relação ao planejado
  `adiantado` · `no_ritmo` · `atrasado` · `critico` · `sem_medida`
- **`trend`** — que direção ela está tomando *(novo)*
  `piorando` · `estavel` · `melhorando` · `retomando`

A combinação é o que produz a frase humana:

> Projeto está em 22% e deveria estar em 60%. Tecnicamente **crítico**. Mas
> ficou oito dias parado e hoje a pessoa fez três ações.
>
> Hoje: *"Projeto está crítico. Reduza a meta."*
> Depois: *"Projeto ainda está atrás, mas voltou a andar hoje depois de oito
> dias."*

### E não precisa de tabela nova

As tasks têm data operacional, então **o passado é recalculável**: é o mesmo
cálculo com outra data de corte.

Quatro snapshots derivados bastam — **hoje · ontem · D-3 · D-7** — e deles saem
`parada → andando`, `normal → atrasada`, `atrasada → crítica`,
`crítica → recuperando`, consistência, queda, aceleração.

Sem migração, sem job de snapshot, sem histórico para manter.

---

## `baixa_execucao` vs `meta_inflada`

Dois diagnósticos onde hoje há um.

| | Evidência | O que dizer |
|---|---|---|
| `baixa_execucao` | estrutura plausível, execução baixa | "Essa arena ficou sem execução esta semana." |
| `meta_inflada` | demanda incompatível com a capacidade demonstrada | "Sua estrutura está pedindo 40 ações por dia. Isso precisa baixar." |

O critério de `meta_inflada` é **histórico, não instantâneo**: a pessoa nunca
passou de N há X dias, e a estrutura pede muito mais que N. Sem os snapshots do
item anterior, não dá para distinguir — por isso `trend` vem antes.

**Não culpar a pessoa por um erro estrutural** é a diferença de produto aqui. Se
eu pus 2 ações/dia e passei a semana no videogame, não há evidência nenhuma de
que a meta esteja errada. Eu só não fiz.

---

## Streak em risco

A infra já existe inteira: o cron roda a cada 10 minutos e **já monta o contexto
completo**, com streak e as 6 arenas. Falta uma condição.

```
hora >= 21:30  ·  streak >= 7  ·  nenhuma prova hoje  ·  fora do quiet hours
```

**Restrição real:** `TIME_ZONE = "America/Sao_Paulo"` está chumbado no servidor e
**não existe fuso por usuário**. Hoje isso está correto — todo mundo é Brasil.
No dia em que houver alguém fora, o gatilho dispara na hora errada para essa
pessoa. Não é bloqueio agora, é dívida anotada.

E vale trocar a fala de streak que já existe: ela está presa ao caso mais raro
possível (**desmarcar** a última task do dia), tem duas variações fixas e vive
**fora do sistema de tons**.

### O Silencioso não é furado

Duas coisas separadas, dois interruptores:

| | |
|---|---|
| **Presença do Oráculo** | quanto ele comenta |
| **Alertas importantes** *(novo)* | streak em risco, e riscos futuros |

Alguém pode ter **Oráculo: Silencioso** + **Alertas: ligados**. Quem nunca
autorizou não recebe nada.

Isto substitui a M5 do documento anterior, que abria exceções invisíveis. O texto
do Silencioso na tela diz *"Só o essencial"* — o que **não** é licença para push:
ninguém lendo aquilo entende que vai receber notificação. O interruptor
explícito preserva a confiança e ainda salva quem quer ser salvo.

---

## Cada arena com narrativa própria

O Oráculo não deve pensar *"o ciclo está 57%"*. Internamente:

```
Saúde         72%  adiantada  estável
Projetos      31%  crítico    retomando
Estudos       59%  no ritmo   melhorando
Manutenção    12%  crítica    piorando
```

Daí sai: *"Projetos voltou a andar. Manutenção virou o ponto mais atrasado do
ciclo."*

Parece inteligência, e é regra. E evita a coisa terrível de app de produtividade
que reduz a vida inteira a uma barra só — 57% esconde tanto "tudo equilibrado"
quanto "duas em 100% e duas abandonadas".

---

## O risco desta mudança, e como cobrir

**Trocar a cascata pelo árbitro troca 10 `if` legíveis por ~15 tipos de
candidato × 4 números = ~60 constantes ajustadas à mão.** Se essas constantes
forem chute, a gente substituiu uma regra ruim e legível por uma ruim e opaca —
e fica pior de depurar, não melhor.

O que torna a troca segura:

1. **Uma tabela única de candidatos**, com os 4 números explícitos e um
   comentário dizendo por que cada um é o que é. Nada de peso espalhado pelo
   código.
2. **Teste de fixture**: N estados sintéticos de usuário → qual candidato vence.
   Incluindo os casos que hoje dão errado (a pessoa ausente + com virada; a
   arena crítica que está retomando; 40 ações/dia). O teste é a especificação do
   comportamento, e é como a gente ajusta os pesos sem quebrar o resto.
3. **O árbitro devolve lista ranqueada, não vencedor.** O cooldown pode
   descartar o primeiro, e aí o segundo assume. Se devolvesse só o vencedor, um
   candidato em cooldown viraria silêncio indevido.

Sem o item 2 eu não faria essa troca.

---

## Ordem

| # | | Depende de |
|---|---|---|
| 1 | **Candidatos + árbitro** substituem `focusArena` + cascata | — |
| 2 | **`trend` por arena** (snapshots derivados hoje/ontem/D-3/D-7) | — |
| 3 | **`baixa_execucao` vs `meta_inflada`** | 2 |
| 4 | **Streak em risco** via cron + toggle de Alertas | 1 |
| 5 | **Memória curta** — cooldown, não-repetição | 1 |
| 6 | **Marcos e viradas** | 2, 5 |
| 7 | **Gramática do háptico** (3 pesos) | — |
| 8 | **Ampliar o repertório de frases** | tudo acima |

O 8 vem por último de propósito. **Primeiro as frases certas chegam na situação
certa; depois o repertório cresce.** Escrever agora seria escrever para um
seletor que ainda não sabe escolher.

O 7 é independente de tudo e pode entrar a qualquer momento.

---

## O que continua fora

Da Parte 6 do documento anterior, sem mudança:

**Push diário de engajamento.** "Sentimos sua falta" é o que faz desinstalar. O
único push novo é o streak em risco, e só com autorização explícita.

**Mascote com nome, rosto e humor.** A pessoa registra o que quer virar. Um
personagem fazendo piada quando ela falhou três dias é humilhante.

**Elogio inflacionado.** O banco atual acerta nisso e não pode regredir — e o
direito de não falar existe justamente para proteger isso.

**Chamar modelo para gerar fala.** Custo cresce com cadastros, não com receita.
Com árbitro, trend e memória, as 200 linhas atuais já passam de "aleatório".
