# Brief de assets do Glyph

Documento para ser **entregue a outra IA** (geradora de imagem ou de SVG). Cada seção é
autossuficiente: copie o bloco `ESTILO` uma vez, depois o prompt do asset que quer.

Levantado em 2026-09-02 contando o `ITEMS_DB` inteiro: **143 itens, 35 sem `imageUrl`**.
Quando não há imagem o `ItemArt` cai no emoji do sistema — que muda de desenho a cada
fabricante de Android. São **36 desenhos** no total, em dois estilos diferentes que
**não podem ser misturados**.

| | grupo | qtd | estilo |
|---|---|---|---|
| A | Símbolos de valor | 5 | SVG plano, monocromático |
| B | Baús | 5 | PNG pintado |
| C | Insígnias | 16 | PNG pintado |
| D | ~~Cabelos~~ | ~~8~~ **0** | **cabelo não é recompensa** — é de graça, e a arte já existe; corrigido no código |
| E | Buracos pontuais | 3 | PNG pintado |
| F | Ícone de categoria | 7 | SVG plano, monocromático |

Os dois estilos existem por um motivo: **A e F ficam colados em números e rótulos, com
17 px de altura**, e pintura não sobrevive a esse tamanho. **B, C e E ficam dentro de
placas de 40 a 122 px** e precisam combinar com os 108 PNGs que já existem no catálogo.

### Antes de encomendar: baú e insígnia estão marcados como "arte opcional"

`constants/items.ts:559` divide as categorias em duas listas, e ela decide se um item sem
PNG aparece ou some do catálogo:

```ts
PNG_REQUIRED_CATEGORIES = { skin, artifact, border, banner, glyph, orb, plate, hair }
PNG_OPTIONAL_CATEGORIES = { aura, ui_skin, chest, insignia, insignias }
```

Item de categoria **obrigatória** sem `imageUrl` é escondido por `isItemCatalogVisible` —
é o que garante que nada apareça quebrado. Item de categoria **opcional** aparece do mesmo
jeito, com emoji. É por isso que as 16 insígnias e os baús estão em produção há tempo sem
arte: eles têm licença para viver sem.

`aura` e `ui_skin` são procedurais e ficam onde estão. `chest` e `insignia` estão ali
porque a arte não foi feita — são exatamente os grupos B e C deste documento.

**A armadilha na hora de fechar:** não mova `insignia` e `chest` para `PNG_REQUIRED` antes
de os PNGs estarem na pasta **e** o `imageUrl` preenchido em cada item. No segundo em que
forem movidas sem as duas metades, as 16 insígnias somem do catálogo inteiro. Foi
exatamente essa a armadilha do cabelo, e ela só não estourou porque as duas metades foram
feitas juntas — veja o grupo D.

---

## ESTILO — bloco para colar antes de qualquer prompt de PNG

```
Estilo da casa (obrigatório, os assets precisam combinar com um catálogo existente):

Pintura digital semi-realista de item de jogo de fantasia, renderizada em 3/4 com
volume e profundidade — NÃO é ilustração vetorial plana, NÃO é pixel art, NÃO é
desenho de linha, NÃO é emoji.

Materiais: latão e ouro envelhecidos com filigrana em relevo, pergaminho gasto,
couro escuro, pedra polida. Superfícies com desgaste e arranhões sutis, nunca
plástico limpo.

Iluminação: fonte principal em cima e à esquerda, luz de contorno fria separando o
objeto do fundo, sombra própria suave por baixo. Brilho mágico interno na cor da
raridade indicada, discreto — realça, não ofusca.

Paleta base: latão quente (#B8863F), pergaminho (#D9C9A3), sombra fria (#2A2E38).
A cor da raridade entra só no brilho, na gema e nos detalhes.

Fundo TRANSPARENTE de verdade (alpha real, não branco, não xadrez).
Objeto único e centralizado, ocupando 85% do quadro, com margem de respiro em volta.
Sem texto, sem números, sem moldura, sem cenário, sem chão, sem marca d'água.
Composição frontal ou 3/4 leve. Nada em perspectiva forte.

Entrega: PNG quadrado 512×512, RGBA.
```

**Teste de aceitação de todo PNG:** reduza para 40×40 e olhe. Se virar um borrão sem
silhueta reconhecível, o desenho tem detalhe demais — a grade do Arsenal mostra os itens
nesse tamanho. Silhueta legível a 40 px é requisito, não capricho.

---

## A · Símbolos de valor — 5 SVGs

Estes **não são** pintura. Aparecem colados no número dentro do slot de recompensa, a
17 px, e no resumo do dia. Precisam ler a 16 px numa tela de celular.

### Bloco de estilo para colar

```
Ícone de interface, SVG monocromático, traço único.

Grade 24×24. Traço de 2px, pontas e junções arredondadas (stroke-linecap:round,
stroke-linejoin:round). Preenchimento nenhum ou sólido, nunca gradiente, nunca sombra,
nunca duas cores.

O SVG deve usar `currentColor` em todo stroke e fill — a cor vem do CSS, o arquivo não
decide cor nenhuma. Sem <style> interno, sem classes, sem id.

Geometria simples e simétrica: precisa continuar reconhecível a 16px. No máximo 4 formas.
ViewBox "0 0 24 24" e nada fora dele.

Entrega: um arquivo .svg limpo, sem metadados de editor.
```

### Os cinco

| # | arquivo | o que desenhar | por quê |
|---|---|---|---|
| 1 | `exp.svg` | Raio anguloso, ou chevron duplo apontando para cima | **Não existe hoje.** A EXP é escrita como a palavra "EXP" depois do número. É o símbolo mais visto do jogo: toda recompensa paga EXP |
| 2 | `ouro.svg` | Moeda de perfil com relevo circular interno | Hoje é o emoji 🪙, 6 usos |
| 3 | `fragmento.svg` | Gema lapidada, corte de losango com facetas superiores | Hoje é o emoji 💎, 6 usos. É a moeda de forja |
| 4 | `acoes.svg` | Marca de conferido (check) de traço grosso | Não existe. Vai no resumo do dia |
| 5 | `sequencia.svg` | Chama de contorno simples, ou trilha de três pontos ligados | Não existe. Vai no resumo do dia e no alerta de sequência em risco |

Destino: `public/assets/icons/`.

> **Decida os três juntos.** EXP, ouro e fragmento aparecem **lado a lado no mesmo
> slot**. Se só a EXP virar SVG, o modal mostra dois emoji do sistema ao lado de um
> desenho seu — e a diferença de peso e de estilo salta. Ou os três viram SVG, ou nenhum.

Compartilhar já existe como `ShareIcon` e não entra na conta.

---

## B · Baús — 5 PNGs

O tipo de baú tem **8 valores** (`Comum, Incomum, Raro, Épico, Lendário, Season, Ciclo,
Skin Comum`), mas o `ChestOpeningModal` já os agrupa em **5 vídeos**. A arte fechada segue
o mesmo agrupamento — 5 desenhos cobrem os 8 tipos.

| # | arquivo | cobre | vídeo de abertura | emoji hoje |
|---|---|---|---|---|
| 6 | `bau_normal.png` | Comum, Incomum, Skin Comum | `chest_normal.mp4` | 📤 caixa de saída de e-mail |
| 7 | `bau_prata.png` | Raro, **Ciclo** | `chest_silver.mp4` | 🎁 presente |
| 8 | `bau_ouro.png` | Épico | `chest_gold.mp4` | 🗳️ urna de votação |
| 9 | `bau_epico.png` | **Season** | `chest_epic.mp4` | 🌟 estrela |
| 10 | `bau_lendario.png` | Lendário | `chest_legendary.mp4` | 👑 coroa |

Destino: `public/assets/catalog/interface/`.

**Todos fechados.** O baú aberto não é asset — é o vídeo, e depois dele o modal mostra o
item que saiu.

### Prompts

Cole o bloco `ESTILO` e depois:

**6 · Baú normal** — *raridade comum, brilho cinza-neutro `#A0522D`*
> Baú de madeira escura fechado, tampa arqueada, três cintas de ferro simples com rebites,
> fechadura de ferro batido sem ornamento. Madeira com nós e desgaste. Modesto, sólido,
> honesto. Sem gema, sem dourado.

**7 · Baú prata** — *raridade rara, brilho ouro `#FFD700` (ver nota de cor abaixo)*
> Baú de madeira escura fechado com cantoneiras e cintas de prata polida, filigrana
> gravada nas bordas, fechadura de prata em forma de brasão. Uma gema pequena e clara
> engastada na tampa. Reflexo frio no metal.

**8 · Baú ouro** — *raridade épica, brilho azul `#3B82F6`*
> Baú fechado revestido de ouro, filigrana densa em relevo cobrindo a tampa, cantoneiras
> ornamentadas, fechadura em forma de sol. Duas gemas engastadas nas laterais.
> Peso e opulência visíveis.

**9 · Baú épico da temporada** — *raridade mítica, brilho violeta `#7B61FF`*
> Baú fechado de metal escuro com veios luminosos correndo pelas juntas como se algo
> vivo estivesse dentro. Filigrana em espiral, gema grande e facetada no centro da tampa,
> partículas de luz subindo em volta. Estranho antes de ser rico.

**10 · Baú lendário** — *raridade lendária, brilho roxo `#A855F7`*
> Baú fechado monumental, ouro e obsidiana, coroado por um arco de metal trabalhado.
> Filigrana em relevo profundo, três gemas alinhadas na tampa, fissuras luminosas
> pulsando entre as placas. Aura visível. O objeto mais imponente da série.

### Duas coisas para arrumar no código, não no desenho

**Os nomes dos vídeos estão trocados** e vão confundir na hora da substituição:
`chest_gold.mp4` é o baú **épico** e `chest_epic.mp4` é o **season**. Renomear agora é
barato; depois de a arte entrar, cada troca vira uma chance de errar o par.

**A coroa 👑 é usada em quatro lugares ao mesmo tempo** — baú lendário, Insígnia do Barão,
Insígnia do Rei e cabelo "Princesa". Quatro coisas sem relação nenhuma, um desenho só.

---

## C · Insígnias — 16 PNGs

**Nenhuma das 16 tem arte.** É a categoria mais exposta do jogo: a insígnia aparece no
perfil, na grade do Arsenal e em todo modal de recompensa. É 100 % emoji.

Destino: `public/assets/catalog/interface/`, arquivo com o **mesmo nome do id do item**.

### C.1 · As dez de patente — desenhe como sistema

São dez degraus da mesma escada. **Não são dez ideias diferentes.** Uma silhueta comum,
com o metal e o interior evoluindo — fica coerente, fica óbvio qual é maior, e é mais
barato de produzir e de manter.

> **Base comum a todas:** medalha em formato de escudo heráldico, mesma silhueta, mesma
> proporção, vista de frente. O que muda de degrau para degrau é o **metal da moldura**, a
> **quantidade de ornamento** e o **emblema no centro**.

| # | arquivo | patente | metal da moldura | emblema central |
|---|---|---|---|---|
| 11 | `insignia_rank_1_vagante.png` | Vagante · comum | ferro cru, sem polimento | estrada que se perde no horizonte |
| 12 | `insignia_rank_2_escudeiro.png` | Escudeiro · comum | ferro com borda limpa | escudo pequeno cruzado por uma lança |
| 13 | `insignia_rank_3_cavaleiro.png` | Cavaleiro · incomum | bronze | duas espadas cruzadas |
| 14 | `insignia_rank_4_lorde.png` | Lorde · raro | prata | torre de castelo com dois estandartes |
| 15 | `insignia_rank_5_barao.png` | Barão · épico | prata com filete de ouro | coroa baixa de três pontas |
| 16 | `insignia_rank_6_conde.png` | Conde · épico | ouro fosco | pergaminho selado com lacre |
| 17 | `insignia_rank_7_duque.png` | Duque · lendário | ouro polido | gema facetada engastada no centro |
| 18 | `insignia_rank_8_principe.png` | Príncipe · lendário | ouro com esmalte azul | estrela de oito pontas |
| 19 | `insignia_rank_9_rei.png` | Rei · lendário | ouro com gemas nas bordas | coroa alta de cinco pontas |
| 20 | `insignia_rank_10_soberano.png` | Soberano · lendário | ouro e obsidiana, aura visível | tridente sobre um sol irradiando |

Progressão obrigatória: **ferro → bronze → prata → ouro → ouro com gema → ouro com aura**.
O ornamento cresce junto. Olhando as dez lado a lado, a ordem tem que ser óbvia sem ler
nome nenhum.

### C.2 · As seis de conquista

Estas **não** usam a silhueta de escudo — são de outra família, e a diferença de forma é
o que impede confundir "subi de patente" com "fechei um ciclo".

| # | arquivo | insígnia | forma | desenho |
|---|---|---|---|---|
| 21 | `insignia_report_comum.png` | de Relatório de Ciclo · comum | **pergaminho** | rolo de pergaminho fechado com fita e lacre de cera |
| 22 | `insignia_quest_incomum.png` | de Missão Incomum · incomum | **fita** | medalha circular de prata pendurada numa fita dobrada |
| 23 | `insignia_levelup_rara.png` | de Patente Rara · raro | **estrela** | estrela de cinco pontas em ouro, relevo em raios |
| 24 | `insignia_quest_master.png` | de Mestre de Quests · raro | **troféu** | taça de duas alças com louros gravados |
| 25 | `insignia_season_genesis.png` | Gênesis · **mítico** | **disco** | disco de obsidiana com uma única fenda de luz violeta atravessando, como uma origem |
| 26 | `insignia_season_aurora_1.png` | Aurora I · **mítico** | **disco** | disco de obsidiana com três faixas de aurora curvas em violeta e verde-água |

> **As duas míticas precisam ser distinguíveis à distância.** Hoje as duas são o emoji 🌌 —
> a mesma galáxia. São as recompensas mais raras do jogo, ficam lado a lado no perfil de
> quem jogou as duas temporadas, e são idênticas. Mesma família (disco de obsidiana),
> conteúdo interno diferente: **Gênesis é uma fenda única, Aurora I são três faixas.**

### Os cinco pares repetidos que isto resolve

| emoji | usado por |
|---|---|
| 👑 | Barão · Rei · baú lendário · cabelo "Princesa" |
| 📜 | Conde · Relatório de Ciclo |
| 💎 | Duque · **o símbolo de fragmento** |
| 🌟 | Príncipe · baú season |
| 🌌 | Gênesis · Aurora I |

---

## D · Cabelos — nada a desenhar, e já foi corrigido no código

Os 8 penteados apareciam no levantamento como "sem `imageUrl`" e entraram na primeira
versão desta lista por engano. **Cabelo não é recompensa** — é customização gratuita, e
isso está escrito no código em quatro lugares:

**1 · Não cai em baú nem pode ser forjado.** As duas funções de sorteio começam excluindo
a categoria inteira:

```ts
// constants/items.ts
export const isChestEligibleItem = (…) => item.category !== 'hair' && …
export const isForgeEligibleItem = (…) => item.category !== 'hair' && …
```

**2 · Todo penteado já vem liberado**, sem precisar possuir:

```ts
// components/SovereignCustomizer.tsx:118
if (unlockCategory === 'hairStyles') return true;
// components/ItemDetailModal.tsx:53
if (category === 'hair') return true;   // checkOwnership
```

**3 · É filtrado do aviso de recompensa.** `utils/vanguardRewards.ts:18` remove hair da
lista de itens do pacote da Vanguarda antes de montar o texto.

**4 · A arte já existe, e está completa.** 26 PNGs em
`public/assets/catalog/avatars/hair/`, um por variante de cor. Conferi cada combinação de
`HAIR_DB` contra o disco: **26 de 26 existem, nenhum arquivo órfão, nenhuma variante
quebrada.**

### O que mudou no código

Cabelo estava em `PNG_OPTIONAL_CATEGORIES` — a lista de categorias que podem existir sem
PNG. Isso estava errado por um motivo diferente do que parecia: **a arte existe**, então o
penteado não deveria ter licença para aparecer como emoji. Se um dia a arte sumir, o certo
é o penteado sair do catálogo, não aparecer com um 💇 no lugar do desenho.

O caminho do cabelo era montado só na hora de desenhar o avatar, por `getHairUrl` a partir
de tier + cor — dados que o `ITEMS_DB` não guarda. Por isso o campo ficava vazio. Mover a
categoria sem resolver isso teria escondido os oito penteados **tendo os 26 PNGs no
disco**, porque `hasRasterAsset` lê exatamente esse campo.

As duas metades foram feitas juntas:

- cada penteado passou a declarar `imageUrl: hairPngAsset(id)` — a cor padrão, que é a
  mesma com que o customizador abre;
- `hair` saiu de `PNG_OPTIONAL_CATEGORIES` e entrou em `PNG_REQUIRED_CATEGORIES`.

E `tests/item-art.regression.mjs` passou a travar isso, junto com o resto do catálogo:
todo `imageUrl` tem de apontar para arquivo que existe no disco (a checagem antiga olhava
só se o campo estava preenchido, então um caminho com erro de digitação passava e virava
quadrado vazio na tela); toda variante de cor de `HAIR_DB` tem de existir; e a lista de
itens escondidos por falta de arte fica fixada, para não crescer em silêncio.

> **O emoji de cabelo quase não era visto de todo jeito.** A grade do Arsenal percorre
> `inventory`, e cabelo nunca vira instância de inventário — é grátis, não cai de baú, não
> é forjável, não está na loja. Sobrava o painel de GM (`constants/GMboard.ts:45`), que usa
> `imageUrl || ''` e mostrava vazio. Esse agora tem caminho.

Uma observação que continua valendo para os outros grupos: o ⚡ do "Anime Spiky" é o mesmo
raio proposto para o **símbolo de EXP**, e o 👑 da "Princesa" é a mesma coroa do **baú
lendário** e de **duas insígnias de patente**.

---


## E · Buracos pontuais — 3 PNGs

Os únicos furos em categorias que já estão quase cobertas: skin tem 18 de 20, border tem
15 de 16. Custam pouco e fecham duas categorias inteiras.

| # | arquivo | item | o que desenhar |
|---|---|---|---|
| 27 | `avatars/SKIN_T5_ENTIDADE_DE_LUZ.png` | Entidade de Luz · lendário | figura humanoide feita de luz, contornos dissolvendo em partículas, sem rosto definido |
| 28 | `avatars/SKIN_T4_EMPREENDEDOR.png` | Empreendedor · épico | traje social moderno, terno escuro bem cortado, postura confiante |
| 29 | `interface/borda_t4_soberano.png` | Borda Soberano · épico | moldura circular de avatar, ouro com espinhos heráldicos, gema no topo — **siga `borda_t4_guardia.png`**, que é a borda irmã |

As skins seguem o enquadramento de `SKIN_T3_NOMADE.png` (corpo inteiro, 3/4, fundo
transparente). A borda é um **anel vazado**: o miolo precisa ser transparente de verdade,
porque o avatar aparece por dentro dele.

---

## F · Ícone de categoria — 7 SVGs

Rede de segurança. Quando um item novo entrar sem arte, o `ItemArt` mostra o ícone da
**categoria** em vez de um emoji sorteado. Mesmo estilo do grupo A: SVG mono, 24×24,
`currentColor`.

| # | arquivo | categoria | itens hoje | desenho |
|---|---|---|---|---|
| 30 | `cat-artefato.svg` | artifact | 29 | losango facetado |
| 31 | `cat-skin.svg` | skin | 20 | busto/silhueta de ombros |
| 32 | `cat-borda.svg` | border | 16 | anel com quatro marcas nos quadrantes |
| 33 | `cat-banner.svg` | banner | 15 | estandarte com ponta em V |
| 34 | `cat-glifo.svg` | glyph | 10 | runa angular dentro de um círculo |
| 35 | `cat-orbe.svg` | orb | 7 | esfera com um brilho deslocado |
| 36 | `cat-placa.svg` | plate | 6 | retângulo com cantos chanfrados |

Destino: `public/assets/icons/`.

---

## Fora da lista, de propósito

**Auras (8) não precisam de arte.** `getAuraBackground` em `utils/auraVisuals.ts` gera o
visual em CSS a partir do nome do item. É procedural, funciona, e desenhar 8 PNGs para
substituir seria trabalho para piorar.

**Moldura de raridade não é asset.** É borda e gradiente com o hex da raridade, que já
existe em `constants/rarityVisuals.ts`. O que falta ali é código, não desenho.

**Insígnia de bronze para missão individual não existe como item.** Não adianta desenhar:
precisa entrar no `ITEMS_DB` primeiro. Hoje a insígnia mais baixa de missão é a *Incomum*,
que é prata.

---

## Nota de cor — leia antes de escolher a paleta de um asset

O app tem **duas escalas de raridade que discordam entre si**, e os prompts acima usam a
**escala de medalha**, que é a do `ItemDetailModal`, do `ProfileView` e do
`ReportResultCarousel`:

| # | raridade | medalha (usada aqui) | RPG (`rarityVisuals.ts`) |
|---|---|---|---|
| 1 | Comum | marrom `#A0522D` | cinza `#9CA3AF` |
| 2 | Incomum | prata `#C0C0C0` | verde `#22C55E` |
| 3 | Raro | **ouro `#FFD700`** | azul `#3B82F6` |
| 4 | Épico | azul `#3B82F6` | roxo `#A855F7` |
| 5 | Lendário | roxo `#A855F7` | âmbar `#F59E0B` |
| 6 | Mítico | **não existe — cai no `else` e sai marrom** | violeta `#7B61FF` |

O mesmo item **muda de cor quando a pessoa clica nele**: o pontinho na grade do inventário
vem de `getTierVisual` (RPG), a etiqueta do modal que abre vem da medalha. Um item raro é
azul na grade e ouro no modal.

**Isto precisa ser resolvido antes de a arte entrar**, senão os PNGs vão nascer combinando
com metade das telas. Se a escala mudar depois, os brilhos de raridade de 21 PNGs ficam
errados de uma vez.

A sexta raridade merece um parágrafo próprio: **mítico é a raridade de temporada**. Os 7
itens `tier: 6` / `rarity: 'mythic'` têm todos `isSeasonExclusive: true`, e não existe item
de temporada fora do tier 6. Na escala de medalha o mítico nunca foi escrito — sai marrom,
a cor da mais comum. O item mais raro do jogo aparece como o mais banal.

---

## Convenção de arquivo

| destino | convenção | exemplo existente |
|---|---|---|
| `public/assets/catalog/interface/` | minúsculo, prefixo da categoria | `borda_t4_guardia.png` |
| `public/assets/catalog/avatars/` | MAIÚSCULO, prefixo da categoria | `SKIN_T3_NOMADE.png` |
| `public/assets/catalog/avatars/hair/` | prefixo `CABELO_`, com tier e cor | `CABELO_T4_PRINCESA_cast.png` |
| `public/assets/icons/` | minúsculo com hífen, `.svg` | — (pasta nova) |

Insígnias usam **o próprio id do item** como nome de arquivo. Depois de colocar o PNG na
pasta, o item precisa ganhar o campo `imageUrl` em `constants/items.ts` — o arquivo
sozinho não aparece em lugar nenhum.

`tests/item-art.regression.mjs` confere as duas pontas: todo `imageUrl` do catálogo tem de
apontar para um arquivo que existe. Um caminho com erro de digitação vira quadrado vazio na
tela, que é pior do que emoji — emoji parece escolha, quadrado vazio parece defeito.

## Ordem sugerida

**A + B primeiro: 10 desenhos.** Aparecem em toda recompensa do jogo — é o maior salto por
desenho feito, e resolve os emoji mais absurdos (a urna de votação como baú épico).

**C depois: 16.** Resolve os cinco pares repetidos e cobre a categoria mais exposta.

**E e F podem esperar. D saiu da lista** — cabelo e customizacao gratuita, nao recompensa.
