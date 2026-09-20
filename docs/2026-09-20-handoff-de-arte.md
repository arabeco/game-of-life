# Handoff de arte — o que desenhar, e por quê

Saiu da conversa por tópico de 20/09/2026, cruzada com o `ITEMS_DB` de verdade.
As contas são do catálogo depois que o glifo e o orbe saíram: **134 itens**.

**21 desenhos, mais quatro peças de jardim.** Roupa 13, cabelo 4, wallpaper 4,
jardim 4 (modelo 3D).

Aura não entra: ela é código, não arte. Ver a nota no fim.

---

## 1 · Roupa — 19 hoje, 30 depois

**13 desenhos: 11 roupas novas e 2 que já existem sem arte.**

### As 2 que já existem e estão sem desenho

| Item | Raridade | Onde |
|---|---|---|
| **Entidade de Luz** | lendária | **prêmio do 10 Soberano** |
| Empreendedor | épica | só baú |

A Entidade de Luz é a mais cara de deixar como está: é o último degrau da escada,
o prêmio que mais gente vai perseguir. Quem chegar lá hoje recebe `✨`, o emoji
do sistema, que muda de desenho em cada Android.

### As 11 novas, e onde cada uma entra

**Três para o pacote inicial** — comuns. Hoje ele dá quatro (Náufrago, Casual,
Caçador, Casual 2) e a primeira promoção custa 100 horas. Até lá o guarda-roupa
é o único lugar do jogo onde a pessoa se vê, e quatro peças mais o "nenhuma"
fazem um ciclador de cinco posições. Sete tira o ar de uniforme.

**Uma para o 5 Barão** — incomum. É o único degrau sem roupa. Era a Militar, que
foi tirada de propósito em 06/09.

**Três para trocar as que se pode comprar.** Estes três degraus entregam hoje uma
roupa que também está na loja, ou seja: dá para comprar o que se ganharia.

| Degrau | Dá hoje | Também custa |
|---|---|---|
| 3 Cavaleiro | Acadêmico | 35 ouro |
| 7 Duque | Nômade | 70 ouro |
| 9 Rei | Armadura Placa | 190 ouro |

As três atuais continuam na loja; o degrau passa a dar peça exclusiva.

**Quatro livres** — para baú, missão ou temporada, onde fizer falta depois.

---

## 2 · Cabelo — 8 hoje, 12 depois

**4 desenhos.** Continuam livres para todos: o `SovereignCustomizer` libera a
categoria inteira, não passam por inventário.

O que existe hoje, para não repetir silhueta:

Cachos · Médio Reto · Texturizado · Dreads · Mullet com Topete · Anime Spiky ·
Princesa · Fluxo Espiritual

Cada um tem **26 variantes de cor** geradas por recolorização, então um desenho
novo vira 26 peças. Ver `constants/avatarOffsets.ts`: o encaixe é medido em
pixels a 500×500, que é o tamanho da arte.

---

## 3 · Wallpaper — 6 hoje, 10 depois

**4 desenhos.** Um por patente.

Hoje são as `PLACA_*` e todas as seis só saem por ouro:

| Item | Raridade | Preço |
|---|---|---|
| Placa Madeira | comum | 18 (e vem no pacote inicial) |
| Placa Pedra | incomum | 42 |
| Placa Prata | rara | 95 |
| Placa Roxa | épica | 200 |
| Placa Ouro | lendária | 340 |
| Placa Gelo | lendária | 360 |

**A categoria se chama `plate` no código e "Placa" na tela.** Fica combinado
chamar de *wallpaper*: é o que ela é — o fundo em que o avatar fica em cima, e a
única coisa do perfil que aparece atrás de tudo.

As quatro novas fecham os dez degraus. A escada de raridade hoje pula: comum,
incomum, rara, épica, lendária, lendária — falta corpo no meio.

---

## 4 · Jardim — peças para um sexto kit

**Quantidade a combinar. É modelo 3D, não PNG.**

O jardim tem 18 peças. Tirando as 3 de água (que vêm do terreno, não de kit) e
as 3 de assinatura (uma por coleção), sobram **12 para os kits** — e 12 dividem
em cinco kits, com o último saindo curto:

| Kit | Pedra | Caminho | Planta | Luz |
|---|---|---|---|---|
| **Básico** · grátis | Pedra avulsa | Caminho reto | Pinheiro | — |
| **Kit 2** | Rocha musgosa | Caminho curvo | — | Lanterna de pedra |
| **Kit 3** | Conjunto natural | Passos livres | Bordo japonês | — |
| **Gourmet** | — | — | Bambuzal, Jardineira | Lanterna suspensa |
| **Extras** | as 3 assinaturas | | | |

**Falta um sexto.** Cada kit tem de levar um pouco de cada família — senão a
pessoa compra um e fica com um jardim só de pedra —, então o sexto pede pelo
menos **uma pedra, um caminho, uma planta e uma luz**: quatro peças novas.

O que já existe, para não repetir silhueta:

- **Pedra** — Pedra avulsa, Rocha musgosa, Conjunto natural
- **Caminho** — Caminho reto, Caminho curvo, Passos livres
- **Planta** — Pinheiro, Bordo japonês, Bambuzal, Jardineira de flores
- **Luz** — Lanterna de pedra, Lanterna suspensa
- **Assinatura** — Totem das três pedras, Guardião do pátio, Relicário de ametista

Cada peça é desenhada **uma vez e recolorida por tema**: a mesma geometria vira
"de rio", "de calcário" e "de basalto". Então quatro peças novas viram doze
aparições. Ver `views/zen3d/collections.ts`.

---

## O que NÃO é desenho

### Aura — é código

Nenhuma aura é arquivo. São **seis cores por aura** em `utils/auraVisuals.ts` —
core, bloom, haze, ring, spark, shadow — que o `drawAuraCanvasEffect` pinta no
canvas do avatar. Criar uma aura nova custa seis linhas.

A **Eclipse** (épica, 8 Príncipe) foi criada assim em 20/09. E existe uma nona já
escrita e sem item nenhum apontando para ela: a **Fênix Dourada**.

Para ver todas: `tools/as-auras.html`.

O que a aura não tem é **miniatura**. Na loja e no inventário ela sai como emoji,
porque essas telas procuram um arquivo. Se um dia isso incomodar, a saída barata
é a grade desenhar a aura em CSS com o mesmo `getAuraBackground` da folha — não
precisa de PNG.

### Borda e banner — não faltam, sobram, e nenhuma nova entra

17 e 16, todas com arte menos a Borda Soberano. O problema delas não é desenho, é
**porta**: 8 bordas e 10 banners só saem por ouro.

Ficou decidido em 20/09 que **não se desenha nenhuma nova**. Chegou a estar em
cima da mesa uma por patente — vinte peças — e caiu: já há coisa demais. Só a
Borda Soberano fica na escada, no degrau 10. As outras 32 vão sair por regra,
com quest invisível e modal.

A Borda Aprendiz e o Banner Aprendiz passam a vir no pacote inicial.

### Insígnia — está pronta

16, todas desenhadas, uma para cada uma das dez patentes.

---

## A conta

| Categoria | Hoje | Depois | Desenhos |
|---|---|---|---|
| Roupa | 19 | 30 | **13** |
| Cabelo | 8 | 12 | **4** |
| Wallpaper | 6 | 10 | **4** |
| Jardim (3D) | 15 peças | 19 | **4** |
| | | | **25** |

O caso mais urgente dos 25 é um só: **a Entidade de Luz**. Os outros vinte e
quatro melhoram o jogo; esse conserta uma promessa quebrada no topo da escada.
