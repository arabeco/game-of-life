# O catálogo inteiro — quantos, de que raridade, e por onde entram

Levantamento de 20/09/2026. Os números saíram de **carregar o `ITEMS_DB` de
verdade** e cruzar com o `RANK_REWARDS`, não de ler o arquivo com expressão
regular: as portas dependem de helpers (`isChestEligibleItem`,
`isLegacyRetired`) que regex nenhuma reproduz.

**150 itens. 12 categorias.**

---

## O mapa

| Categoria | Total | comum | incom | raro | épico | lendá | mítico | sem arte |
|---|---|---|---|---|---|---|---|---|
| Artefato | 29 | 8 | 7 | 8 | 4 | 2 | — | 0 |
| **Skin (roupa)** | 19 | 6 | 3 | 3 | 4 | 1 | 2 | **2** |
| Borda | 17 | 2 | 2 | 4 | 6 | 1 | 2 | **1** |
| Banner | 16 | 2 | 2 | 3 | 6 | 1 | 2 | 0 |
| Insígnia | 16 | 3 | 2 | 3 | 2 | 4 | 2 | 0 |
| Glifo | 10 | 3 | 1 | 2 | 2 | 2 | — | 0 |
| Skin de UI | 9 | 1 | — | 2 | 3 | 1 | 2 | 0 |
| Cabelo | 8 | 2 | 1 | 2 | 2 | 1 | — | 0 |
| **Aura** | 8 | 3 | 2 | 1 | — | 2 | — | **8** |
| Orbe | 7 | 1 | 2 | 1 | 1 | 2 | — | 0 |
| Placa (tábua) | 6 | 1 | 1 | 1 | 1 | 2 | — | 0 |
| Jardim | 5 | — | 1 | 1 | 2 | 1 | — | 0 |

---

## Por onde se entra

| Qtd | Porta |
|---|---|
| 42 | loja **+** baú |
| 36 | patente |
| 29 | só baú |
| 11 | temporada |
| 6 | patente + loja + baú |
| 3 | staff |
| 2 | quest |
| 1 | patente + loja |
| 1 | temporada + quest |

**19 aparecem sem porta na conta bruta, e 18 têm explicação:**

- **8 cabelos** — viraram aparência, livres para todos, como os corpos. Correto.
- **9 peças do jardim antigo** — marcadas `isLegacyRetired: true`. Aposentadas de
  propósito quando o jardim virou o 3D.
- **1 insígnia de relatório** — entregue no fecho do ciclo, direto no código
  (`ReportsView.tsx:1032`), sem passar pela tabela de patente.

**Sobra uma, e essa é órfã de verdade:** `insignia_levelup_rara`, "Insígnia de
Patente Rara". Existe no catálogo e **nada no app a entrega**.

---

## O que falta desenhar: 11

| Categoria | Qtd | Quais |
|---|---|---|
| **Aura** | **8** | Bruma, Safira, Rubi, Esmeralda, Prata, Ouro, Pedra da Lua, Multiverso |
| Skin | 2 | Entidade de Luz *(prêmio do Soberano)*, Empreendedor |
| Borda | 1 | Soberano |

**A categoria de aura não tem um único desenho.** É o maior buraco isolado do
catálogo, e é uma categoria inteira invisível — oito itens que existem, podem
cair de baú, e aparecem como emoji.

A **Entidade de Luz** é o caso mais caro: é o prêmio do **Soberano**, o décimo e
último degrau. Quem chegar ao topo recebe `✨`, o emoji do sistema.

---

## Sobre organizar isto

Três leituras que o levantamento deixa claras:

### A distribuição já está razoavelmente equilibrada

42 itens em loja+baú e 29 só em baú: **71 dos 150 podem cair de baú**, quase
metade. Não é um catálogo represado atrás de dinheiro.

### As raridades altas estão concentradas em três categorias

Borda, banner e insígnia somam **49 itens** — um terço do catálogo — e carregam a
maior parte dos épicos e míticos. São também as três categorias mais baratas de
desenhar, porque são moldura, fundo e selo: não precisam encaixar em corpo nenhum.

Skin, cabelo e aura são as caras — têm de conversar com o avatar.

### O gargalo não é quantidade, é porta

Só **2 itens** entram por quest e **11** por temporada. Contra 36 por patente. A
escada de patente está carregando quase sozinha o papel de "recompensa por
jogar", enquanto missão e temporada quase não entregam nada.

Se a ideia é dar mais motivo para jogar, **a alavanca é criar portas, não itens**
— há 29 itens que hoje só existem em baú e poderiam virar prêmio de missão sem
desenhar nada novo.

### Baú com dois itens

Com 71 itens elegíveis a baú, a chance de repetido já é baixa. Dois itens por baú
é viável — mas a conta que importa não é a do desenho, é a do `Alcance`: o
`docs/a-escada.html` já mostra que o baú Lendário tem alcance 11 e o Mítico 3.
**Dar dois de um baú de alcance 3 esgota o baú na segunda abertura.**

O lugar onde dois itens cabem sem quebrar nada é a faixa de baixo — Comum,
Incomum e Raro, com alcance 53 a 55.
