# Plano de recompensas — cada coisa no seu lugar

Decisões de 20/09/2026, cruzadas com o que já existe no `ITEMS_DB` e no
`RANK_REWARDS`. São **10 patentes**: Vagante, Escudeiro, Cavaleiro, Lorde, Barão,
Conde, Duque, Príncipe, Rei, Soberano.

---

## Antes: dois nomes trocados no código

O que se chama **`glyph`** no catálogo são os arquivos `MOLDE_*`, e um deles se
chama literalmente *"Tábua Aprendiz"*. **Esse é o glifo.**

O que se chama **`plate`** são os `PLACA_*` — Madeira, Pedra, Prata, Roxa, Ouro,
Gelo. **Essa é a tábua**, a peça em que o avatar fica em cima, e que na prática
funciona como papel de parede.

Os nomes no código estão trocados em relação a como você fala deles. Vale
renomear antes de mexer, senão toda conversa daqui para a frente vai custar uma
tradução.

---

## O quadro: o que cada patente dá HOJE

| Patente | insíg | glifo | UI | roupa | borda | banner | orbe | aura | artef |
|---|---|---|---|---|---|---|---|---|---|
| 1 Vagante | ✓ | ✓ | ✓ | **4** | — | — | — | — | — |
| 2 Escudeiro | ✓ | — | ✓ | ✓ | ✓ | — | — | — | — |
| 3 Cavaleiro | ✓ | — | ✓ | ✓ | — | ✓ | — | — | ✓ |
| 4 Lorde | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| 5 Barão | ✓ | — | ✓ | — | ✓ | — | ✓ | — | — |
| 6 Conde | ✓ | — | ✓ | ✓ | ✓ | — | — | — | — |
| 7 Duque | ✓ | ✓ | — | — | — | ✓ | — | — | ✓ |
| 8 Príncipe | ✓ | — | — | ✓ | — | — | ✓ | — | — |
| 9 Rei | ✓ | ✓ | — | — | ✓ | — | — | — | ✓ |
| 10 Soberano | ✓ | ✓ | — | ✓ | — | — | ✓ | — | — |
| **Cobertura** | **10/10** | 5/10 | 6/10 | 7/10 | 4/10 | 2/10 | 3/10 | **0/10** | 3 |

**Insígnia já está pronta** — uma por patente, as dez. É o único caso que já
cumpre o plano.

---

## O plano, ponto a ponto

### 1 · Orbe por patente

Faltam **7 degraus**. E há um problema antes do desenho:

> **O orbe não dá bônus nenhum.** Procurei em `utils/` e `contexts/` por qualquer
> efeito — exp, multiplicador, desconto — e não existe. Ele é puramente
> cosmético. Então não há "bonusinho" para o modal de patente mostrar: ele
> precisaria ser inventado primeiro.

**Itens: 7 existem, 10 degraus. Faltam 3 orbes novos.**

### 2 · Borda por patente

Hoje são 4 de 10. **17 bordas existem** — dá para preencher os 6 degraus que
faltam sem desenhar nada. Uma delas (Soberano) está sem arte.

### 3 · Insígnia por patente

**Pronto.** As dez estão lá. Além delas existem as de evento — relatório de
ciclo, missão, temporada completa. A de ciclo já é entregue no fecho
(`ReportsView.tsx:1032`).

**Uma órfã para resolver:** `insignia_levelup_rara` existe e nada no app a
entrega.

### 4 · Glifo por patente

Hoje são 5 de 10. **Existem exatamente 10 glifos** — o número exato de patentes.
Preenche sem desenhar nada, e sobra zero. Coincidência boa demais para não usar.

### 5 · Skin de UI por patente e por temporada

Hoje são 6 de 10, e param no Conde. **9 existem: falta 1** para fechar os dez.

A ideia de ser o prêmio final da temporada é separada e não conflita — hoje há 2
skins de UI míticas que já saem por temporada.

### 6 · Cabelo e corpo livres

**Já está.** Os 8 cabelos e os 8 corpos não são itens de inventário; o
`SovereignCustomizer` os libera direto.

### 7 · Jardim

Fica para uma passada própria. Há **5 itens de jardim no catálogo** (bases e
kits, comprados por ouro) e **9 peças antigas aposentadas** (`isLegacyRetired`),
do jardim anterior ao 3D.

O que você viu na sua conta de GM e não está no catálogo precisa ser levantado
por dentro do jardim 3D, que tem catálogo próprio em `public/garden3d/catalog/`.
**Não dá para decidir raridade e quantidade sem esse levantamento.**

### 8 · Tábua (as `PLACA_*`) como papel de parede

Sai da escada de patente. Vai para **baú + uma básica no pacote inicial**, e
cresce depois. Hoje são 6, todas compráveis por ouro.

### 9 · Aura por patente

O caso mais caro, e o mais urgente:

- **0 de 10 degraus** — nenhuma aura é prêmio de patente hoje
- **8 existem, faltam 2** para os dez degraus
- **nenhuma das 8 tem desenho** — a categoria inteira é emoji

Tirar a aura do baú é decisão certa pelo motivo que você deu: um efeito pequeno
não se lê como prêmio quando cai no meio de outros.

**Custo: 10 desenhos** — as 8 que existem sem arte, mais 2 novas.

### 10 · Borda e banner com regras extras

Além de uma por patente, desbloqueios por condição — *"fechou 2 arenas de
espiritualidade no mesmo ciclo → Místico"*.

**A máquina para isso já existe.** O `SKIN_SEASON_UNLOCKS` mapeia item para
missão cumprida, e o `BorderSelectionModal` já consulta
`completedSeasonMissions` para liberar borda. O que falta é a condição ser
calculada a partir do ciclo, e não de uma missão de temporada — mas o caminho de
entrega está pronto.

Banner hoje é o mais vazio da escada: **2 de 10**, com 16 itens disponíveis.

---

## A conta do desenho

| O que | Qtd | Por quê |
|---|---|---|
| **Aura** | **10** | 8 sem arte + 2 novas para fechar os degraus |
| Roupa | 3 | Duque (raro), Rei (épico), Entidade de Luz (lendário, sem arte) |
| Orbe | 3 | 7 existem para 10 degraus |
| Skin de UI | 1 | 9 existem para 10 degraus |
| Borda | 1 | a do Soberano está sem arte |
| Roupa | 1 | Empreendedor, sem arte |

**19 desenhos** fecham a escada inteira e zeram o catálogo sem arte.

E **nenhum desenho** é preciso para glifo, banner e borda: os itens já existem e
já têm arte — falta só apontá-los para os degraus vazios.

---

## O que fica de graça

Duas coisas que o levantamento achou e que não custam arte nenhuma:

- **`SKIN_T2_MILITAR.png`** está desenhado, 500×500, e nenhum item aponta para
  ele. É a roupa do Barão, de graça.
- **29 itens só caem de baú** e nada mais. Virar prêmio de missão ou de condição
  não custa desenho — eles já existem prontos.
