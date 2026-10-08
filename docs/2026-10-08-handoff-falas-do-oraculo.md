# Handoff — as falas do Oráculo

Para quem vai escrever. O código já está pronto. Você escreve **só o texto**, no
formato do fim deste arquivo, e ele entra no app sem retrabalho.

O Glyph é um app de hábitos com cara de jogo. A pessoa monta **arenas** (áreas
da vida), coloca **ações** nelas, planeja o dia no **planner** e joga em
**ciclos** de alguns dias (normalmente 7 a 14). O **Oráculo** é a voz do app:
comenta o que está acontecendo, em frases curtas.

---

## 1. O mapa

```
ORÁCULO
├─ 1. Push ao acordar ...... ~7h · 1 leitura + 1 card de sabedoria por dia
│     ├─ Leitura do ciclo ....... ESCREVER (bloco A) · o mesmo texto do botão do chat
│     └─ Card de sabedoria ...... NÃO MEXER
├─ 2. Abertura ............. ao abrir o app, 1x por dia ...... ESCREVER (bloco B)
├─ 3. Reações .............. na hora em que a pessoa conclui algo ... ESCREVER (bloco C)
├─ 4. Botão "Ler meu dia e ciclo" no chat ... é a Leitura do bloco A
├─ 5. Missão individual .... texto montado da proposta ........ NÃO MEXER
└─ 6. Sem uso .............. saudações, dicas, lore ........... NÃO MEXER
```

**Não mexer:** os cards de Sabedoria (são temas que a pessoa escolhe) e o texto
da missão individual. Estão bons.

---

## 2. As regras de tom (valem para os três blocos)

1. **Português do Brasil, com acento.** Fala de igual para igual, com "você".
2. **Curta.** Uma ideia por frase, até ~110 caracteres. Notificação corta o resto.
3. **Sem bronca. Nunca.** Nenhuma frase manda cortar, reduzir meta, pausar ou
   abandonar arena, "deixar ir", nem diz que a pessoa está atrasada, para trás
   ou que "não dá pra salvar". Quando o número é baixo, a frase constata e
   aponta um passo pequeno para a frente — sem sermão.
4. **De manhã aponta para a frente.** O dia ainda não aconteceu: nada de julgar
   o dia, nem o plano, antes de ele começar.
5. **Só os números da lista.** Cada situação diz quais marcadores (`{assim}`)
   existem nela. Não invente outros: uma frase com marcador que não existe
   naquela situação é descartada pelo app e nunca aparece.
6. **Variantes dizem coisas diferentes.** Duas frases do mesmo lugar não podem
   ser sinônimas: uma constata, outra comenta, outra puxa o próximo passo.
7. **Sem emoji, sem "você consegue!", sem ponto de exclamação em fila.**

### O que NÃO fazer — frases de hoje que vão sair

- "Não dá pra salvar tudo neste ciclo. Escolhe o que importa e deixa o resto ir."
- "{arena} parou. Decide agora: uma ação pequena hoje, ou pausa a arena."
- "Antes de compensar, tire uma meta. Fechar menos inteiro vale mais que muito pela metade."
- "{acoes} ações por dia é o que está montado. Corte pela metade e você passa a fechar o dia."
- "{count} ações hoje. Para de abrir e fecha o que ficou em pé."
- "{action}: {count}/{target}. Divide as {remaining} pelos dias restantes e para de improvisar."

Todas mandam a pessoa fazer menos, ou dão ordem sem ninguém ter pedido.

---

## 3. Bloco A — a Leitura do ciclo (push da manhã e botão do chat)

Sai às ~7h como notificação e também quando a pessoa aperta "Ler meu dia e
ciclo". O app junta **uma frase do ciclo + uma frase do dia**, nessa ordem.
Exemplo do que sai hoje:

> Seu ciclo está indo bem: 45%, dia 6 de 14. Hoje tem 5 ações no seu planner.

Esta parte **não tem tom**: é uma voz só. Escreva **de 1 a 3 frases** por situação.

**Frases do ciclo**

| Situação | Quando | Marcadores |
|---|---|---|
| `ciclo_comeca` | dia 1 do ciclo | `{total_dias}` |
| `ciclo_indo_bem` | o percentual está no ritmo (com 2 dias de folga) e já tem algo feito | `{pct}` `{dia}` `{total_dias}` `{faltam_dias}` |
| `ciclo_abaixo` | abaixo do ritmo, ou nada feito ainda | `{pct}` `{dia}` `{total_dias}` `{faltam_dias}` |
| `ciclo_sem_meta` | o ciclo existe, mas nenhuma ação tem meta | `{dia}` `{total_dias}` `{faltam_dias}` |
| `ciclo_prazo_acabou` | a data final passou e o ciclo ainda não foi fechado | `{pct}` `{total_dias}` |

`ciclo_abaixo` é o que mais pede cuidado: é a pessoa que mais precisa ouvir uma
coisa boa. Constate o número sem adjetivo e aponte para hoje.

**Frases do dia** (a frase some quando não há nada no planner)

| Situação | Quando | Marcadores |
|---|---|---|
| `dia_planejado` | tem ações no planner, nenhuma feita | `{agendadas}` `{agendadas_acoes}` |
| `dia_andando` | parte feita | `{feitas}` `{agendadas}` `{faltam}` `{feitas_acoes}` `{faltam_acoes}` |
| `dia_completo` | tudo do planner feito | `{feitas}` `{agendadas}` `{feitas_acoes}` |

Os marcadores `_acoes` já vêm com a palavra certa: `{agendadas_acoes}` vira
"1 ação" ou "5 ações". Os sem `_acoes` são só o número.

**Uma frase avulsa:** `nada_para_ler` (sem marcador) sai quando a pessoa aperta o
botão e não tem nem ciclo nem planner.

---

## 4. Bloco B — a Abertura

Um balão, uma vez por dia, quando a pessoa abre o app. O app escolhe **uma
situação** e uma frase dela. Aqui **há tom**: a pessoa escolhe a voz do Oráculo.

| Tom | O que faz |
|---|---|
| `neutro` | constata. Não sugere, não pergunta, não consola. |
| `coach` | entrega o próximo passo, concreto e pequeno. |
| `reflexivo` | devolve uma pergunta em vez da resposta. |
| `calmo` | tira o peso antes de qualquer coisa. |

Escreva **2 frases por tom** em cada situação (8 por situação).

| Situação | Quando | Marcadores |
|---|---|---|
| `ausente` | voltou depois de 3 dias ou mais sem abrir | `{dias}` |
| `arena_retomada` | uma arena parada há dias voltou a andar hoje | `{arena}` `{dias}` |
| `sem_missao` | tem uma missão individual disponível e nenhuma ativa | `{acao}` |
| `sem_ciclo` | tem arenas, não tem ciclo | `{acao}` |
| `ciclo_longo` | ciclo longo, ainda com pouco progresso | `{dias}` `{progresso}` |
| `sem_entrega` | sem concluir nada há 3 dias ou mais | `{dias}` |
| `streak_marco` | a sequência de dias bateu um marco | `{streak}` |
| `streak_em_risco` | à noite, a sequência quebra se hoje passar em branco | `{streak}` (dias da sequência) `{diasSeguidos}` (quantas noites seguidas isso acontece) |
| `meta_inflada` | o plano pede mais por dia do que o melhor dia já feito | `{acoes}` `{maximo}` |
| `arena_atrasada` | a arena de foco está abaixo do ritmo | `{arena}` |
| `arena_parada` | uma arena está sem movimento há dias | `{arena}` |
| `ciclo_atrasado` | o ciclo inteiro está abaixo do ritmo | — |
| `prioridade` | há uma ação clara para hoje | `{acao}` |
| `ja_entregou` | já concluiu algo hoje | `{acao}` |
| `estrutura_enxuta` | só uma arena, tudo misturado nela | — |

`{acao}` e `{arena}` são nomes que a pessoa escreveu ("Treinar", "Estudo").
`{progresso}` é um percentual, sem o símbolo: escreva `{progresso}%`.

As situações de número baixo (`meta_inflada`, `arena_atrasada`, `arena_parada`,
`ciclo_atrasado`, `ciclo_longo`, `sem_entrega`) são o teste da regra 3: o fato
pode ser dito, mas sem mandar cortar nem pausar. Ex.: em vez de "pausa a arena",
algo como "Uma ação curta em {arena} hoje já a acorda."

---

## 5. Bloco C — as Reações

Um balão na hora em que a pessoa conclui alguma coisa. **Há tom** (os mesmos
quatro). Escreva **2 frases por tom** em cada evento.

Um cuidado: toda conclusão já mostra um aviso com o progresso da ARENA
("Academia: 5 de 7 · faltam 2"). A reação **não repete** essa conta; ela comenta
o momento.

| Evento | Quando | Marcadores |
|---|---|---|
| `daily_reps_low` | a pessoa chegou a 3 ações no dia | `{count}` `{faltam_hoje}` `{resto_do_dia}` `{pct_ciclo}` |
| `daily_reps_mid` | chegou a 5 | idem |
| `daily_reps_high` | chegou a 8 | idem |
| `cycle_goal_first` | primeira repetição de uma ação com meta no ciclo | `{action}` `{target}` `{remaining}` |
| `cycle_goal_last_one` | falta 1 para a meta da ação | `{action}` `{count}` `{target}` |
| `cycle_goal_met` | meta da ação batida | `{action}` `{count}` `{target}` |
| `pact_progress` | avançou na missão individual | `{arena}` `{count}` `{target}` `{remaining}` `{dias}` |
| `pact_last_one` | falta 1 para fechar a missão | `{arena}` `{count}` `{target}` `{dias}` |
| `pact_completed` | missão fechada | `{arena}` `{target}` |
| `milestone_completed` | concluiu um marco | `{action}` |
| `first_after_pause` | primeira conclusão depois de dias parado | `{dias}` |
| `streak_saved` | salvou a sequência no fim do dia | `{streak}` |

Detalhes dos marcadores:

- `{resto_do_dia}` já vem pronto: "faltam 2 para hoje", "falta 1 para hoje" ou
  "nada pendente hoje". Use ele em vez de montar com `{faltam_hoje}`.
- `{pct_ciclo}` é o percentual do ciclo, sem o símbolo: escreva `{pct_ciclo}%`.
  Ele **só existe para quem tem ciclo**. Por isso, em cada tom, **pelo menos uma
  das duas frases não deve usar `{pct_ciclo}`**, senão quem não tem ciclo fica
  sem reação.
- Em `pact_*`, `{dias}` já vem pronto com a vírgula na frente: ", e você tem 3
  dias", ", e o prazo acaba hoje", ou vazio (missão sem prazo). Escreva colado no
  fim de uma oração: "Falta uma para a missão de {arena} fechar{dias}."
- `{action}` e `{arena}` são nomes que a pessoa escreveu.

O pedido do dono do app para as reações de volume do dia: dizer **quantas já
foram, quanto falta hoje e que o ciclo andou**. Exemplo de direção:

> 3 ações hoje, faltam 2 para hoje. Ciclo em 46%.

---

## 6. O formato de volta

Devolva **três blocos de código**, exatamente nestes formatos, sem comentário
dentro deles. Mantenha os nomes das situações e dos eventos como estão aqui.

**Bloco A**

```ts
{
  dia_planejado: ['...'],
  dia_andando: ['...'],
  dia_completo: ['...'],
  ciclo_sem_meta: ['...'],
  ciclo_comeca: ['...'],
  ciclo_indo_bem: ['...', '...'],
  ciclo_abaixo: ['...', '...'],
  ciclo_prazo_acabou: ['...'],
  nada_para_ler: ['...'],
}
```

**Bloco B**

```ts
{
  ausente: {
    neutro: ['...', '...'],
    coach: ['...', '...'],
    reflexivo: ['...', '...'],
    calmo: ['...', '...'],
  },
  // ... uma entrada para cada uma das 15 situações da seção 4
}
```

**Bloco C**

```ts
{
  daily_reps_low: {
    neutro: ['...', '...'],
    calmo: ['...', '...'],
    coach: ['...', '...'],
    reflexivo: ['...', '...'],
  },
  // ... uma entrada para cada um dos 12 eventos da seção 5
}
```

Use aspas simples. Se a frase tiver aspas dentro, use aspas duplas nelas
("assim"). Antes de entregar, confira: todo marcador usado está na lista daquela
situação, e nenhuma frase quebra a regra 3.
