# Handoff de arte — os 10 fundos de patente e a Borda Soberano

Saiu da conversa de 06/10/2026, conferido contra o código de hoje. É o que sobrou
do handoff de 20/09: o resto da lista foi entregue e já está no app.

**11 peças.** Dez fundos, um por patente, e uma borda.

| O que | Quantos | Formato | Hoje, no lugar da arte |
|---|---|---|---|
| Fundo de patente | **10** | JPG retrato 2:3, 1024×1536 | um gradiente na cor da patente |
| Borda Soberano | **1** | PNG 500×500, transparente | nada: o item fica escondido do catálogo |

A borda é a mais urgente das duas. Ela é prêmio da patente 10, e item de borda sem
PNG não aparece no catálogo. Quem chegar em Soberano hoje ganha uma borda que
não aparece no inventário.

---

## 1 · Os 10 fundos de patente

### Onde aparecem

Não é um modal só. É fundo de perfil, e o mesmo arquivo aparece em quatro lugares,
cada um com um recorte diferente:

| Onde | Recorte | O que aparece da imagem |
|---|---|---|
| **Escada de patentes** (toque em "Sua Patente", no Perfil) | faixa de ~4:1, do meio | só a faixa do meio, escurecida forte à esquerda |
| Escada, cartão do topo (a sua patente atual) | faixa de ~2,5:1, do meio | a faixa do meio, sob um véu escuro pesado |
| **Perfil** — quem escolher este fundo | retrato 10:17, inteiro | tudo, menos ~6% de cada lateral, com o perfil por cima |
| **Seletor de fundo** | 16:9, do meio | miniatura, com coroa até chegar na patente |
| **Lista do Mundo** — atrás do nome de quem usa | faixa de ~5:1, do meio | só a faixa do meio, escurecida à esquerda |

O modal de subida de patente só **anuncia** o fundo em texto ("🖼 Fundo Rei
liberado"). Não mostra a imagem.

**A escada é onde mais aparece:** dez cartões empilhados, cada um com o seu fundo.
E ali só se vê uma tira do meio, com a esquerda quase preta, onde ficam o nome e a
EXP. Degrau não alcançado ainda sai meio cinza e meio apagado.

### A ideia da série: o mesmo pedestal, dez vezes

Dez pedidos soltos devolvem dez imagens que não conversam. Na escada elas ficam
empilhadas, então têm de ler como **uma coleção**.

**Natureza-morta.** Um pedestal de pedra escura, sempre o mesmo, à direita do
centro, com um facho de luz vindo de cima. Sobre ele, **o objeto do nome do
degrau** — a mesma regra das roupas: Escudeiro veste de escudeiro, e o fundo do
Escudeiro mostra o que é de escudeiro. O que muda de um para o outro é o objeto e a
cor da luz. Câmera, pedestal, enquadramento e escuro ao redor não mudam.

**O Soberano é o único sem objeto.** No pedestal dele há só luz contida. É a
mesma regra da roupa dele: não é o rei mais enfeitado, é outra coisa.

### As dez

As cores são as dos gradientes que o app mostra hoje no lugar da arte, então nada
muda de cor quando a imagem chegar.

| # | Patente | Arquivo | EXP | No pedestal | Cor da luz | O que tem de dizer |
|---|---|---|---:|---|---|---|
| 1 | Vagante | `rank01vagante.jpg` | início | lanterna de ferro com a chama no fim, cajado gasto, capa de viagem dobrada | cinza frio `#4a5058` | começo de estrada |
| 2 | Escudeiro | `rank02escudeiro.jpg` | 6.000 | escudo redondo de madeira com borda de couro e **uma** ombreira solta | aço `#55697f` | carrega a armadura de outro |
| 3 | Cavaleiro | `rank03cavaleiro.jpg` | 15.000 | elmo de placa polido e o punho de uma espada | azul `#6d93b8` | a primeira peça de metal |
| 4 | Lorde | `rank04lorde.jpg` | 30.000 | carta com selo de cera, pena e tinteiro — **nenhum metal** | verde `#5d9b78` | poder que não precisa mais lutar |
| 5 | Barão | `rank05barao.jpg` | 60.000 | anel de sinete de ouro sobre veludo, moedas, gola de pele dobrada | vinho `#9c4356` | riqueza que se mostra |
| 6 | Conde | `rank06conde.jpg` | 120.000 | tecido de corte dobrado, com um brasão bordado a fio de ouro à vista | roxo `#7d55a8` | o primeiro traje sob medida |
| 7 | Duque | `rank07duque.jpg` | 240.000 | capa pesada caindo do pedestal até o chão, com um grande fecho de ombro dourado | índigo `#7a86ad` | volume: ocupa mais espaço |
| 8 | Príncipe | `rank08principe.jpg` | 420.000 | diadema fino sobre almofada branca, faixa de seda cruzada, pedestal de mármore claro | azul real `#8f9ed6` | claro contra o escuro dos anteriores |
| 9 | Rei | `rank09rei.jpg` | 660.000 | coroa sobre almofada de arminho e uma corrente de ordem dobrada ao lado | ouro `#d4af52` | o topo do que é humano |
| 10 | Soberano | `rank10soberano.jpg` | 1.000.000 | **nada**: uma luz contida pairando — esfera ou aro de luz, com poeira de luz | luz dourada pálida `#f4e6b0` | não é o rei mais enfeitado. É outra coisa |

### As regras, e por que cada uma existe

**Tamanho.** Retrato **2:3, 1024×1536**: é o tamanho que o GPT já gera, e cobre o
perfil (10:17) cortando só as laterais. Entrega em PNG ou JPG; a compressão para
JPG de até ~400 KB é feita na integração.

> O brief de 08/09 pedia 3:4 (1200×1600). Depois dele o perfil virou placa 10:17,
> mais alta: um 3:4 ali perderia mais de um quinto da largura. O 2:3 resolve os dois.

**Onde fica o objeto — a regra que mais quebra.**

- **Altura:** o objeto inteiro cabe numa faixa de **20% da altura, centrada no
  meio** (de 40% a 60%). É a única faixa que a escada e a lista do Mundo mostram.
  Objeto alto demais ou no topo some em três dos quatro lugares.
- **Largura:** **à direita do centro**, entre 55% e 85% da largura. A escada
  escurece a esquerda quase até o preto; a direita é a única parte limpa.
- **Bordas laterais livres:** nada importante nos 6% de cada lado — o perfil corta.

**O que NÃO pode ter:**

- **Texto de qualquer tipo** — nome, número, lema. O nome da patente já vai por cima
  em todo lugar.
- **Pessoa, rosto, mão ou manequim.** O avatar fica por cima e as duas figuras
  disputariam. Capa e armadura vão **dobradas ou caídas** sobre o pedestal, nunca
  vestindo uma forma de corpo.
- **Detalhe fino no terço de cima.** No perfil, ali ficam nickname, patente e
  insígnia.
- **Contraste alto no meio.** No perfil, os widgets ficam por cima do meio.
  Textura sim, drama não.

**O que ajuda:** valor médio-escuro no geral (o texto por cima é branco), vinheta
nas bordas, e a cor da patente concentrada **num ponto** — o objeto iluminado — em
vez de espalhada pela imagem. Na escada o degrau não alcançado perde metade da cor,
então o que segura a leitura é o brilho do ponto, não o matiz.

### Como gerar: em cadeia, não em paralelo

O que faz as dez lerem como série é gerar uma a partir da outra. Mesma conversa,
na ordem da escada:

1. Gere o **Vagante** com o pedido-base.
2. Para cada próxima, **anexe a anterior** e use o pedido de cadeia.
3. Se uma sair com câmera ou pedestal diferente, refaça antes de seguir — erro de
   enquadramento passa adiante para todas as seguintes.

**Pedido-base (o Vagante):**

```
Fundo vertical 2:3 (1024x1536) para um app de hábitos com estética de fantasia
medieval, elegante e escura. Natureza-morta: um pedestal de pedra escura polida,
à direita do centro, na altura do meio da imagem. Sobre ele, uma lanterna de
ferro com a chama quase no fim, um cajado de madeira gasto e uma capa de viagem
dobrada. Um único facho de luz suave vem de cima e ilumina só o pedestal e o
objeto; a luz tem cor cinza fria (#4a5058) e se concentra ali. O resto da imagem
cai num escuro de pedra lisa, com vinheta nas bordas.

Composição obrigatória: o objeto inteiro cabe numa faixa de 20% da altura,
centrada no meio, e fica entre 55% e 85% da largura. A metade esquerda é quase
vazia e escura. O terço de cima é calmo, sem detalhe. Tom geral médio-escuro,
contraste baixo: textura sim, drama não.

Proibido: pessoas, rostos, mãos, manequins, texto, letras, números, logotipos.
Pintura digital realista, acabamento de jogo premium.
```

**Pedido de cadeia (do Escudeiro ao Rei — anexar a imagem anterior):**

```
Mesma cena da imagem anexa: mesmo pedestal, mesma câmera, mesmo enquadramento,
mesmo facho de luz de cima, mesmo escuro ao redor. Troque só o que está sobre o
pedestal por [NO PEDESTAL] e a cor da luz por [COR DA LUZ]. Mantenha o objeto
inteiro na faixa do meio (de 40% a 60% da altura), à direita do centro. Sem
pessoas, manequins, texto ou letras.
```

Preencha `[NO PEDESTAL]` e `[COR DA LUZ]` com as colunas da tabela. No Príncipe,
acrescente: *"o pedestal agora é de mármore claro; o objeto é claro contra o
escuro"*.

**Pedido do Soberano (anexar o Rei):**

```
Mesma cena da imagem anexa: mesmo pedestal, mesma câmera, mesmo enquadramento,
mesmo escuro ao redor. Agora o pedestal está vazio de objetos: sobre ele paira
apenas uma luz contida, uma esfera suave de luz dourada pálida (#f4e6b0), com
poeira de luz flutuando em volta. Nenhum raio saindo, nenhuma explosão: luz
guardada, não luz gritando. Fica na faixa do meio (de 40% a 60% da altura), à
direita do centro. Sem pessoas, manequins, texto ou letras.
```

---

## 2 · A Borda Soberano

### Onde aparece

Em volta da foto do jogador, em todo lugar que mostra o avatar: o cabeçalho do app,
o perfil, a lista do Mundo e o relatório do ciclo. **Na lista do Mundo ela tem
48 pixels.** Tudo que não ler nesse tamanho vira ruído.

### O que tem de dizer

É o topo da escada: o prêmio mais caro do jogo, ao lado da roupa Soberano, da Aura
Multiverso e da Insígnia Soberano. Tem de ser da mesma família visual dessas duas
artes que já existem:

- **a insígnia Soberano** — filigrana de ouro, uma **opala iridescente** no centro
  e seis gemas pequenas em volta (safira, ametista, esmeralda, rubi, topázio e
  diamante);
- **a roupa Soberano** — marfim e ouro claro, com uma luz dourada no peito.

E a mesma regra da roupa: **luz contida, não ornamento.** Sem coroa — a coroa é do
Rei, e a borda do GM já usa uma.

### As regras técnicas

As bordas que existem seguem as mesmas proporções, e a nova tem de seguir também,
porque o app sobrepõe o PNG inteiro à foto sem ajuste nenhum:

| Medida | Valor | Por quê |
|---|---|---|
| Tamanho | **500×500** (o GPT gera 1024×1024; reduzimos na integração) | o tamanho da maioria das outras |
| Fundo | **transparente de verdade** (alpha) | a borda vai por cima da foto e do fundo do perfil |
| Centro | **círculo vazio e transparente de ~64% da largura** (raio ~160 px a 500) | é onde a foto aparece; nas outras, de 58% a 70% |
| Anel | só a faixa externa, **grosso** | precisa ler em 48 px |
| Forma | redonda, simétrica, centralizada, nada fora do quadro | o app não recorta nem centraliza |

**Pedido:**

```
Moldura circular de avatar para jogo, vista de frente, renderização 3D premium,
fundo TRANSPARENTE. O centro é um círculo vazio e transparente que ocupa 64% da
largura — é onde fica a foto do jogador. O anel ocupa só a faixa externa e é
grosso o bastante para ser lido em 48 pixels: poucos elementos grandes, nada de
filigrana fina.

Material: ouro claro e marfim, com relevo largo. No topo, uma opala iridescente
lapidada (azul, roxo, verde e laranja) como peça central; nas quatro diagonais,
quatro gemas pequenas: safira, ametista, esmeralda e rubi. Uma luz quente e
contida brilha da borda interna do anel para dentro, como se a moldura guardasse
luz — sem raios saindo.

Perfeitamente redonda, simétrica, centralizada, nada encostando na borda do
quadro. Sem coroa, sem texto, sem letras. Mesma família visual das molduras
anexas.
```

**Anexar junto** (todos em `public/assets/catalog/`):

| Arquivo | Para quê |
|---|---|
| `interface/borda_t4_celestial.png` | família visual e espessura do anel |
| `interface/borda_aurora_i.webp` | o centro transparente e o tamanho do vão |
| `interface/insignia_rank_10_soberano.webp` | a opala e as gemas |
| `avatars/SKIN_T5_SOBERANO.png` | o marfim e o ouro |

**Não anexar** a `interface/borda_gm.png`: ela tem coroa e as letras GM, e a
Soberano não pode parecer com ela.

Se a borda sair com fundo branco em vez de transparente, não refaça por isso: o
fundo se remove na integração. Refaça se o **vão do centro** sair pequeno, oval ou
fora do centro — isso não tem conserto depois.

---

## Entrega

Basta salvar com estes nomes. Pode ser no Downloads.

| Peça | Nome |
|---|---|
| Fundos | `rank01vagante` … `rank10soberano` (a lista está na tabela das dez) |
| Borda | `borda_soberano.png` |

## Integração — do nosso lado, não de quem desenha

- **Fundos:** viram JPG 1024×1536 de até ~400 KB, entram em
  `public/assets/backgrounds/` e os dez nomes entram em `FUNDOS_EMPACOTADOS`, em
  `utils/profileBackgrounds.ts`. Vão **dentro do app**, e não no bucket: perfil é
  a tela mais vista, e pelo bucket cada abertura baixa a imagem de novo. Isso
  pede um AAB novo.
  *Atalho sem AAB:* subir no bucket `user-images/background/` com os mesmos nomes.
  O app já procura lá e liga na hora — com o custo de egress acima.
- **Borda:** entra como `public/assets/catalog/interface/borda_soberano.png`, e o
  item `item_border_4_002` ganha o `imageUrl` em `constants/items.ts`. É o
  `imageUrl` que tira o item da lista de arte pendente e o põe no catálogo.
- **Conferência:** cada fundo nos quatro recortes (faixa da escada com o véu
  escuro, perfil 10:17 com a interface por cima, lista do Mundo, miniatura 16:9),
  e os dez empilhados como na escada, para ver se leem como série. A borda sobre
  uma foto, em 48 px e no tamanho do perfil.
