# O funil da missão individual

**Data:** 30/09/2026
**Estado:** desenho aprovado, não implementado

## O problema

Hoje a missão individual chega como uma lista de pactos prontos. Duas queixas
reais do Afonso:

1. **Não é apelativa.** "A pessoa teoricamente quer todas" — três opções boas
   não ajudam a escolher, e escolher entre coisas que você quer é perda.
2. **Pede compromisso cedo demais.** "Senão a pessoa já tem o ciclo, uai." O
   ciclo já é um compromisso; pedir outro por cima, do nada, cobra duas vezes.

A missão só se justifica se ela **recortar** o que já existe, em vez de somar.

## O desenho

Um funil de três perguntas, da mais leve para a mais concreta:

### Passo 1 — Que tipo de compromisso

Os quatro tipos já existem em `ArenaPactKind`. O que muda é o nome na tela:

| `kind` | na tela |
|---|---|
| `constancia` | **Não falhar** — aparecer em N dias diferentes |
| `retomada` | **Voltar ao que parou** |
| `conclusao` | **Fechar o que falta** |
| `volume` | **Fazer bastante** |

**Só aparece o tipo que tem arena atrás.** Sem nenhuma arena parada, "Voltar ao
que parou" não existe na tela. Oferecer um tipo que leva a uma lista vazia é
pior que não oferecer: ensina a desconfiar do passo 1.

Na prática isso costuma render duas opções, não quatro — e duas é escolha,
quatro é cardápio.

### Passo 2 — Em qual arena

As arenas que têm aquele tipo disponível, **cada uma com o seu motivo**:

> Academia · parada há 9 dias
> Leitura · registrada em 12 dos últimos 30 dias

O motivo já existe pronto (`ArenaPact.motivo`) e não custa nada mostrar. Sem
ele a pessoa escolheria de memória — que é justamente o trabalho que a missão
deveria tirar dela.

### Passo 3 — Qual tamanho

Só existe quando há mais de uma faixa. Hoje só o `volume` tem três (leve, média,
alta); nos outros, escolher a arena já entrega o pacto e o passo some.

Um passo que às vezes não aparece é melhor que um passo com uma opção só.

## O que NÃO muda

- A mecânica dos pactos: `buildPactsForArena`, `measurePactProgress`,
  `acceptArenaPact` continuam como estão.
- Os três pactos abertos (`retomada`, `conclusao`, `constancia`) continuam sem
  prazo. Dar prazo a eles é mudança de mecânica, não deste desenho.
- O slot continua sendo **um**: "um compromisso de cada vez" é regra antiga e
  confirmada.

## Como saber se funcionou

O sinal não é quantas pessoas abrem a tela — é **quantas saem com um pacto
aceito**. Hoje a lista é abandonada porque escolher custa. Se o funil funcionar,
a taxa de aceite sobe sem a oferta ter mudado de conteúdo: são os mesmos pactos,
perguntados em outra ordem.

## Ciclo curto: nunca ficar sem opção

Num ciclo de 5 dias sobram poucas propostas, e o funil pode chegar ao passo 2
com uma arena só — ou a nenhuma. **Ficar sem opção é o pior resultado
possível:** a pessoa abriu procurando algo para fazer e o app respondeu que não
tem nada.

A rede é uma escada de pedidos pequenos, do mais concreto para o mais leve. A
primeira que tiver arena atrás é a que aparece:

1. **Fechar o que falta** (`conclusao`) — a meta é o trabalho restante, medida
   em ações e não em dias, então cabe em ciclo de qualquer tamanho. É a melhor
   rede porque é a mais concreta: você sabe exatamente o que falta.
   *Exige `totalPlanned >= 3` e algo restando.*
2. **Voltar ao que parou** (`retomada`) — pede **2 ações**. Cabe em qualquer
   ciclo. *Exige a arena estar parada há 7 dias ou mais.*
3. **Não falhar** (`constancia`) — com o piso de 2 dias do `4742c0a`, é o menor
   pedido que ainda é constância.

Se nenhuma das três tiver arena, o funil não abre — e a tela deve dizer isso
com todas as letras em vez de mostrar uma lista vazia.

**Quando só existe um caminho, o passo 1 é pulado.** Uma pergunta com uma
resposta só não é pergunta, é um clique a mais.
