# Handoff de arte — o que desenhar, e por quê

Saiu da conversa por tópico de 20/09/2026, cruzada com o `ITEMS_DB` de verdade.
São **125 itens** no catálogo, depois que o glifo, o orbe e o jardim 2D saíram.

**26 desenhos.** Roupa 14, cabelo 4, wallpaper 4, jardim 4.

Aura não entra: ela é código, não arte. Borda e banner também não: têm 33 peças
desenhadas e o problema delas é porta. Ver *O que NÃO é desenho*.

---

## 1 · Roupa — as nove da escada

**A regra nova resolve sozinha uma pergunta velha.** A roupa de cada degrau passa
a ser **a roupa do nome do degrau**. Escudeiro veste de escudeiro, Rei veste de
rei. Ninguém precisa explicar por que aquela roupa está ali.

E o que é esquisito — Náufrago, Nômade, Alquimista, Mago Círculo — sai da escada
e vai para o baú e a loja, que é onde variedade vale.

| Degrau | Roupa a desenhar | Raridade |
|---|---|---|
| 2 Escudeiro | **Escudeiro** | comum |
| 3 Cavaleiro | **Cavaleiro** | incomum |
| 4 Lorde | **Lorde** | incomum |
| 5 Barão | **Barão** | incomum |
| 6 Conde | **Conde** | raro |
| 7 Duque | **Duque** | raro |
| 8 Príncipe | **Príncipe** | épico |
| 9 Rei | **Rei** | épico |
| 10 Soberano | **Soberano** | lendário |

**Nove desenhos.** Oito são itens novos; o décimo já existe como
`item_skin_5_001` — chamava-se *Entidade de Luz* e foi renomeado, porque sob a
regra nova o décimo degrau veste de Soberano. A arte dele nunca existiu, então
renomear não jogou nada fora.

**O Soberano é o mais caro de errar.** É o último degrau, o prêmio que mais gente
vai perseguir e menos gente vai ver. Quem chega lá hoje recebe `✨`, o emoji do
sistema, que muda de desenho em cada Android. E ele tem de ler como **acima de um
rei** — não é o rei mais enfeitado, é outra coisa.

### Mais cinco, fora da escada

**O pacote inicial fica mais generoso.** Hoje ele dá quatro roupas — Náufrago,
Casual, Caçador e Casual 2 — e a primeira promoção custa 6.000 EXP, que na régua
de um EXP por minuto são **100 horas**. Até lá o guarda-roupa é o único lugar do
jogo onde a pessoa se vê, e quatro peças mais o "nenhuma" fazem um ciclador de
cinco posições: perto demais de um uniforme.

| Item | Raridade | Onde | Por quê |
|---|---|---|---|
| **quatro comuns novas** | comum | pacote inicial | passa de 4 para 8, mais o Street que desce da escada |
| **Empreendedor** | épica | só baú | existe no catálogo e nunca foi desenhada |

O nome de cada uma das quatro deve dizer o que ela é antes de a pessoa clicar.

**Total da roupa: 14 desenhos.**

---

## 2 · Cabelo — 8 hoje, 12 depois

**4 desenhos.** Continuam livres para todos: o `SovereignCustomizer` libera a
categoria inteira, não passam por inventário, e há teste proibindo o pacote
inicial de conceder cabelo.

O que existe hoje, para não repetir silhueta:

Cachos · Médio Reto · Texturizado · Dreads · Mullet com Topete · Anime Spiky ·
Princesa · Fluxo Espiritual

Cada um tem **26 variantes de cor** por recolorização, então um desenho novo vira
26 peças. Ver `constants/avatarOffsets.ts`: o encaixe é medido em pixels a
500×500, que é o tamanho da arte.

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

A categoria se chama `plate` no código e "Placa" na tela. Fica combinado chamar
de **wallpaper**: é o fundo em que o avatar fica em cima, e a única coisa do
perfil que aparece atrás de tudo.

A escada de raridade hoje pula — comum, incomum, rara, épica, lendária, lendária.
Falta corpo no meio.

---

## 4 · Jardim — quatro peças para o sexto kit

**Modelo 3D, não PNG.**

O jardim tem 18 peças. Tirando as 3 de água (que vêm do terreno, não de kit) e as
3 de assinatura (uma por coleção), sobram **12 para os kits** — e 12 dividem em
cinco, com o último saindo curto.

| Kit | Pedra | Caminho | Planta | Luz |
|---|---|---|---|---|
| **Básico** · grátis | Pedra avulsa | Caminho reto | Pinheiro | — |
| **Kit 2** | Rocha musgosa | Caminho curvo | — | Lanterna de pedra |
| **Kit 3** | Conjunto natural | Passos livres | Bordo japonês | — |
| **Gourmet** | — | — | Bambuzal, Jardineira | Lanterna suspensa |
| **Extras** | as 3 assinaturas | | | |

**Falta um sexto.** Cada kit tem de levar um pouco de cada família — senão a
pessoa compra um e fica com um jardim só de pedra —, então o sexto pede pelo
menos **uma pedra, um caminho, uma planta e uma luz**.

O que já existe, para não repetir silhueta:

- **Pedra** — Pedra avulsa, Rocha musgosa, Conjunto natural
- **Caminho** — Caminho reto, Caminho curvo, Passos livres
- **Planta** — Pinheiro, Bordo japonês, Bambuzal, Jardineira de flores
- **Luz** — Lanterna de pedra, Lanterna suspensa
- **Assinatura** — Totem das três pedras, Guardião do pátio, Relicário de ametista

Cada peça é desenhada **uma vez e recolorida por tema**: a mesma geometria vira
"de rio", "de calcário" e "de basalto". Quatro peças novas viram doze aparições.
Ver `views/zen3d/collections.ts`.

---

## O que NÃO é desenho

### Aura — é código

Nenhuma aura é arquivo. São **seis cores por aura** em `utils/auraVisuals.ts` —
core, bloom, haze, ring, spark, shadow — que o `drawAuraCanvasEffect` pinta no
canvas. Criar uma aura nova custa seis linhas.

A **Eclipse** (épica, 8 Príncipe) foi criada assim em 20/09. Existe uma nona já
escrita e sem item nenhum apontando para ela: a **Fênix Dourada**.

Para ver todas: `tools/as-auras.html`.

O que a aura não tem é **miniatura**: na loja e no inventário ela sai como emoji,
porque essas telas procuram um arquivo. A saída barata, se incomodar, é a grade
desenhar a aura em CSS com o mesmo `getAuraBackground` da folha.

### Borda e banner — não faltam, sobram

17 e 16, todas com arte menos a Borda Soberano. O problema delas é **porta**.

Ficou decidido em 20/09 que **não se desenha nenhuma nova**. Chegou a estar na
mesa uma por patente — vinte peças — e caiu. Só a Borda Soberano fica na escada,
no degrau 10; a Borda e o Banner Aprendiz vão para o pacote inicial; as outras
saem por **11 regras**, com quest invisível e modal. As regras estão em
`docs/os-133-itens.md`.

### Insígnia — está pronta

16, todas desenhadas, uma para cada uma das dez patentes.

---

## A conta

| Categoria | Hoje | Depois | Desenhos |
|---|---|---|---|
| **Roupa** | 19 | 28 | **14** |
| Cabelo | 8 | 12 | **4** |
| Wallpaper | 6 | 10 | **4** |
| Jardim (3D) | 15 peças | 19 | **4** |
| | | | **26** |

A ordem, se for em partes:

1. **Soberano** — o topo da escada entrega um emoji hoje
2. **as outras oito da escada** — é o que faz a regra dos nomes existir
3. **as quatro do pacote inicial** — as primeiras 100 horas de todo mundo
4. o resto
