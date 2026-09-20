# Skins — o que existe, como se ganha, e o que falta desenhar

Levantamento feito em 20/09/2026 contando o `ITEMS_DB`, o `constants/nobility.ts`
e o `sql/new_player_bootstrap_rewards.sql`. Nenhum número aqui foi estimado.

---

## O que existe hoje

**16 itens de skin no catálogo. 18 PNGs no disco.** A diferença é o primeiro
achado, mais abaixo.

| Raridade | Qtd | Quais | Como se ganha hoje |
|---|---|---|---|
| Comum (T1) | 6 | Náufrago, Casual, Caçador, Casual 2 | pacote inicial **e** patente Vagante — os dois, as mesmas quatro |
| | | Street | patente Escudeiro |
| | | Gym Rat | **só loja** |
| Incomum (T2) | 3 | Acadêmico, Tático, Executivo | Cavaleiro, Lorde, Conde |
| Raro (T3) | 3 | Nômade, Alquimista, Híbrido | **só loja**, nenhuma é ganhável |
| Épico (T4) | 2 | Mago Círculo | patente Príncipe |
| | | Armadura Placa | **só loja** |
| Lendário (T5) | 1 | Entidade de Luz | patente Soberano |
| Mítico (T6) | 2 | Vestido Real | baú de temporada |
| | | Guardião Aurora | quest de temporada |
| GM | 1 | O Criador | só staff |

---

## Três coisas erradas

### 1. Tem arte paga fora do jogo

`SKIN_T2_MILITAR.png` está no disco, com 500×500, pronto — **e não existe item
nenhum apontando para ele.** Foi desenhado e nunca entrou. É a skin mais barata
de adicionar que existe: já está paga.

### 2. A patente máxima entrega um emoji

`item_skin_5_001` **Entidade de Luz** é a recompensa do **Soberano**, o último
degrau da escada, e é declarada com `catalogItem` — sem asset. Quem chega ao topo
recebe `✨`, o emoji do sistema, que muda de desenho em cada Android.

É o pior lugar possível para faltar arte: o prêmio que mais gente vai perseguir e
menos gente vai ver.

### 3. A patente 1 repete o pacote inicial

O pacote de boas-vindas entrega `item_skin_1_001, 002, 005, 006`. A patente
**Vagante** entrega exatamente as mesmas quatro — e Vagante é a patente com que
se começa. A recompensa chega duas vezes pelo mesmo motivo, no mesmo minuto.

Era isto que estava sobrando: não é "subir de patente dá várias skins", é a
patente inicial duplicando o pacote inicial.

---

## A escada tem três degraus vazios

Dos dez degraus, três não entregam skin nenhuma:

| Patente | Skin |
|---|---|
| 1 · Vagante | 4 (duplicadas do pacote) |
| 2 · Escudeiro | Street |
| 3 · Cavaleiro | Acadêmico |
| 4 · Lorde | Tático |
| **5 · Barão** | **— nada —** |
| 6 · Conde | Executivo |
| **7 · Duque** | **— nada —** |
| 8 · Príncipe | Mago Círculo |
| **9 · Rei** | **— nada —** |
| 10 · Soberano | Entidade de Luz (sem arte) |

E as três raras — Nômade, Alquimista, Híbrido — **não são ganháveis por nada**.
Só saem da loja, por ouro. A escada pula de incomum (Conde) direto para épico
(Príncipe), sem nunca premiar com uma rara.

---

## Proposta

Uma skin por degrau, do Escudeiro ao Soberano. Nove degraus, nove skins, com a
raridade subindo junto — o que já existe cobre seis deles.

| Patente | Raridade | Skin | Situação |
|---|---|---|---|
| Vagante | — | nenhuma | **tirar as 4**; o pacote inicial já entrega |
| Escudeiro | comum | Street | pronta |
| Cavaleiro | incomum | Acadêmico | pronta |
| Lorde | incomum | Tático | pronta |
| Barão | incomum | **Militar** | **arte pronta, falta o item** |
| Conde | raro | Executivo → ou uma das raras | rever |
| Duque | raro | **a criar** | **desenhar** |
| Príncipe | épico | Mago Círculo | pronta |
| Rei | épico | **a criar** | **desenhar** |
| Soberano | lendário | Entidade de Luz | **desenhar** |

**Custo de arte: 3 desenhos.** Duque (raro), Rei (épico) e Entidade de Luz
(lendário). O Barão sai de graça — é só criar o item para o `SKIN_T2_MILITAR.png`
que já está lá.

### Sobre o pacote inicial

Hoje ele entrega quatro comuns. Se a patente Vagante parar de duplicar, o pacote
vira a única porta delas — o que é coerente: são as roupas de quem está chegando.

Se a ideia for dar uma a mais no começo, a candidata é **Gym Rat**, a única comum
que hoje só sai por ouro. Cinco comuns de entrada, e nenhuma comum atrás de
dinheiro.

---

## O resto do que falta desenhar

Contando o `ITEMS_DB` hoje: **99 itens com arte, 13 sem** (fora quatro ids de
gabarito que não são itens de verdade).

| Categoria | Qtd | Observação |
|---|---|---|
| **Aura** | 8 | a categoria inteira: Bruma, Safira, Rubi, Esmeralda, Prata, Ouro, Pedra da Lua, Multiverso |
| Skin | 2 | Entidade de Luz, Empreendedor |
| Borda | 2 | Soberano, Gênesis |
| Banner | 1 | Origem |

As oito auras são o maior buraco isolado do catálogo — nenhuma tem desenho.

### O handoff mais recente ainda em aberto

`docs/2026-09-08-fundos-de-patente-brief-de-arte.md` — os dez fundos de patente.
Eles moram no bucket `user-images/background/` do Supabase, e não no repositório,
então daqui não dá para confirmar se foram entregues. É o único brief de arte
posterior a 05/09 e o candidato a estar pendente.

Os anteriores (02/09 e 03/09) foram em boa parte executados: o
`2026-09-02-o-que-falta-desenhar.md` contava 35 itens sem imagem, e hoje são 13.
