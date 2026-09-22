# Handoff de arte — o que desenhar, e por quê

Saiu da conversa por tópico de 20/09/2026, cruzada com o `ITEMS_DB` de verdade.
São **125 itens** no catálogo, depois que o glifo, o orbe e o jardim 2D saíram.

**26 desenhos, e 25 deles já têm arquivo esperando.** Roupa 14, cabelo 4,
wallpaper 4, jardim 4. Tudo o que é roupa e cabelo já está ligado no app com um
PNG de mentira no nome final — ver *Os arquivos, com o nome final*.

Aura não entra: ela é código, não arte. Borda e banner também não: têm 33 peças
desenhadas e o problema delas é porta. Ver *O que NÃO é desenho*.

E há um pedido que **não acaba**: cada temporada nova pede cinco peças próprias —
skin, borda, banner, insígnia e a vitrine do tema. As 26 de cima fecham a lista;
essas cinco voltam sempre. Ver *5 · Temporada*.

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

### A regra que muda tudo: um desenho serve os oito corpos

Existem **oito corpos** — quatro tons de pele × dois gêneros — e **uma roupa por
item**. Não há versão masculina e feminina: o `SKIN_T1_NAUFRAGO.png` é um arquivo
só, desenhado por cima de qualquer um dos oito.

Então **cada peça tem de ler nas duas silhuetas**. O que funciona: recorte solto,
camada por cima (capa, manto, casaco aberto), cintura marcada por cinto e não por
corte. O que não funciona: peça colada que assume um ombro ou um quadril.

### As nove, com o que cada uma tem de dizer

| Degrau | Ideia | Por que sobe |
|---|---|---|
| 2 **Escudeiro** | gibão de couro, cinto largo, ombreira **de um lado só** | ainda não é armadura — é quem carrega a de outro |
| 3 **Cavaleiro** | peitoral de placa, manto curto | a primeira peça de metal |
| 4 **Lorde** | casaco longo, gola alta, **zero metal** | poder que não precisa mais lutar |
| 5 **Barão** | sobretudo com pele no colarinho, anel à vista | riqueza que se mostra |
| 6 **Conde** | veste de corte, bordado dourado no peito | o primeiro traje feito sob medida |
| 7 **Duque** | capa pesada até o chão, fecho no ombro | volume: ocupa mais espaço que os outros |
| 8 **Príncipe** | traje claro, faixa cruzada, detalhe em ouro | claro contra o escuro de todos os anteriores |
| 9 **Rei** | manto de arminho, corrente de ombro a ombro | o topo do que é humano |
| 10 **Soberano** | luz contida — quase sem tecido reconhecível | **não é o rei mais enfeitado.** É outra coisa |

### As quatro do pacote inicial

O que falta hoje é **silhueta diferente**, não mais camiseta. As comuns atuais —
Náufrago, Casual, Caçador, Casual 2, Street, Gym Rat — são quase todas o mesmo
corpo com outra estampa.

| Nome | O que é | O que acrescenta |
|---|---|---|
| **Pijama** | calça larga e camiseta folgada | a roupa de quem acabou de acordar — e o app é de hábito diário |
| **Corrida** | regata, shorts, tênis | a única leve de verdade |
| **Chuva** | capa longa com capuz | a única com volume acima da cintura |
| **Verão** | leve, ombros de fora | a única que mostra pele |

As quatro leem nos oito corpos: nenhuma depende de ombro ou quadril.

---

## 2 · Cabelo — 8 hoje, 12 depois

**4 desenhos.** Continuam livres para todos: o `SovereignCustomizer` libera a
categoria inteira, não passam por inventário, e há teste proibindo o pacote
inicial de conceder cabelo.

Cada um tem **26 variantes de cor** por recolorização, então um desenho novo vira
26 peças. Ver `constants/avatarOffsets.ts`: o encaixe é medido em pixels a
500×500, que é o tamanho da arte.

### O buraco: quem começa não tem cabelo comprido

Os oito de hoje, por degrau:

| Degrau | Quais | Lê como |
|---|---|---|
| T1 comum | Cachos, Médio Reto | curto/médio, unissex |
| T2 incomum | Texturizado | curto masculino |
| T3 raro | Dreads, Mullet com Topete | médio, unissex e masculino |
| T4 épico | Anime Spiky, Princesa | masculino e **feminino** |
| T5 lendário | Fluxo Espiritual | **feminino** |

**As duas opções claramente femininas são épica e lendária.** Quem entra no jogo
escolhe entre três cortes curtos. O comprimento é prêmio de fim de escada, e não
devia ser: cabelo é a primeira coisa que a pessoa mexe.

### As quatro, e o que cada uma fecha

| Nome | Degrau | O que é | O buraco que tapa |
|---|---|---|---|
| **Rabo de Cavalo** | T1 comum | preso alto, franja solta | **o comprimento no degrau de entrada** |
| **Coque Solto** | T2 incomum | preso no alto com fios caindo | volume feminino sem comprimento |
| **Undercut** | T3 raro | raspado nas laterais, volume em cima | o masculino moderno que falta |
| **Trança Lateral** | T4 épico | longa, caindo de um ombro | comprido sem ser "princesa" |

Fica **4 masculinos, 4 femininos, 4 unissex** — e o comprido presente desde o T1.

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

## 5 · Temporada — cinco peças, e elas voltam

**Esta é diferente de todas as outras deste documento.** As de cima acabam: uma
vez desenhadas as 26, a lista fecha. Esta **recomeça a cada temporada**, e é o
único compromisso de arte que o app tem para sempre.

Uma temporada é uma coleção de cinco vagas. O código as define assim, e não
aceita uma sexta:

```ts
type ItemSeasonSlot = 'skin' | 'border' | 'banner' | 'insignia' | 'ui_skin';
```

| Vaga | O que é | Formato |
|---|---|---|
| **skin** | a roupa da temporada, mítica | PNG 500×500, serve os oito corpos |
| **border** | a moldura do avatar | WEBP |
| **banner** | a faixa do perfil | WEBP |
| **insignia** | o selo de quem viveu aquela temporada | WEBP |
| **ui_skin** | o tema: a cara do app inteiro | PNG de vitrine + as cores, que são código |

As duas temporadas que existem estão **completas** — Aurora II e Genesis Legacy,
as cinco vagas com arte. Não há buraco para tapar hoje; há um pacote para
encomendar toda vez que uma temporada nova nascer.

Os nomes seguem o padrão da Aurora II:

```
public/assets/catalog/avatars/SKIN_QUEST_GUARDIAO_AURORA.png
public/assets/catalog/interface/borda_aurora_i.webp
public/assets/catalog/interface/banner_aurora_i.webp
public/assets/catalog/interface/insignia_season_aurora_1.webp
public/assets/catalog/aurora_i.png
```

Duas observações que economizam retrabalho:

**A insígnia entra junto, e é fácil esquecer.** Ela não aparece no perfil como as
outras quatro — é uma marca pequena, e some da cabeça de quem está desenhando as
peças grandes. Coleção com quatro de cinco não é coleção.

**O `ui_skin` é o único que pode entrar sem arte.** O tema é um conjunto de cores
no código; o PNG é só a vitrine dele na loja. Dá para lançar uma temporada com o
tema funcionando e a vitrine por fazer — não dá para fazer isso com nenhuma das
outras quatro.

A bancada `tools/as-temporadas.html` mostra o que cada temporada carrega e onde
estão os vazios, coleção por coleção.

---

## 6 · Fundo do grupo — sete, um por patente

**7 desenhos.** E eles nao sao enfeite: sao o PREMIO de subir de patente.

Um grupo comeca em Feudo e sobe somando experiencia dos ciclos fechados por
todos os membros. Ate agora isso acontecia em silencio — o `rank_id` trocava no
banco e ninguem via. Agora a subida paga fragmentos e bau a cada membro, e muda
o fundo do grupo, que e a parte que TODO MUNDO ve ao abrir.

E por isso que sao sete desenhos e nao sete cores: o fundo e a unica coisa que
diz, sem texto, que o grupo chegou em outro lugar.

| Patente | EXP para chegar | O que o nome pede |
|---|---|---|
| **Feudo** | 0 | terra de comeco. Madeira, cerca, fogo pequeno — humilde sem ser triste |
| **Bastiao** | 10.000 | a primeira pedra. Muro, torre baixa, algo que se defende |
| **Provincia** | 50.000 | deixou de ser um ponto e virou area. Campo, estrada, telhados |
| **Principado** | 150.000 | ja ha corte. Bandeira, salao, o primeiro sinal de cerimonia |
| **Reino** | 400.000 | coroa e escala. Castelo inteiro, cidade ao redor |
| **Dinastia** | 1.000.000 | tempo. O que se ve e a SUCESSAO — brasoes, geracoes, arquivo |
| **Imperio** | 2.500.000 | alcance. Mapa, mar, terras que nao cabem no quadro |

A escada de peso importa mais que o tema: de Feudo a Imperio sao 250 vezes mais
experiencia, e o desenho tem de crescer junto. Se o Feudo ja for grandioso, nao
sobra para onde ir.

**Formato:** mesmo do wallpaper de perfil — e o fundo atras do conteudo, entao
ele nao disputa com texto. O centro fica calmo; a informacao mora nas bordas.

Nao ha item nem nome de arquivo ainda: eles nascem com o desenho, porque sao
sete e a patente ja da o nome de cada um.

---

## Os arquivos, com o nome final

**Tudo já está ligado no app.** Os itens existem, os degraus apontam para eles, o
baú e a loja os conhecem. No lugar do desenho há um **PNG de mentira** — xadrez
magenta, 500×500, feio de propósito para ninguém confundir com arte pronta.

**Entregar é sobrescrever o arquivo.** Nenhuma linha de código muda, e a peça
aparece no app na hora.

Para saber o que ainda falta, a qualquer momento:

```
npm run arte:pendente
```

### Roupa — 13 arquivos, 500×500

| Peça | Arquivo |
|---|---|
| Pijama | `public/assets/catalog/avatars/SKIN_T1_PIJAMA.png` |
| Corrida | `public/assets/catalog/avatars/SKIN_T1_CORRIDA.png` |
| Chuva | `public/assets/catalog/avatars/SKIN_T1_CHUVA.png` |
| Verão | `public/assets/catalog/avatars/SKIN_T1_VERAO.png` |
| Escudeiro | `public/assets/catalog/avatars/SKIN_T1_ESCUDEIRO.png` |
| Cavaleiro | `public/assets/catalog/avatars/SKIN_T2_CAVALEIRO.png` |
| Lorde | `public/assets/catalog/avatars/SKIN_T2_LORDE.png` |
| Barão | `public/assets/catalog/avatars/SKIN_T2_BARAO.png` |
| Conde | `public/assets/catalog/avatars/SKIN_T3_CONDE.png` |
| Duque | `public/assets/catalog/avatars/SKIN_T3_DUQUE.png` |
| Príncipe | `public/assets/catalog/avatars/SKIN_T4_PRINCIPE.png` |
| Rei | `public/assets/catalog/avatars/SKIN_T4_REI.png` |
| **Soberano** | `public/assets/catalog/avatars/SKIN_T5_SOBERANO.png` |

### Cabelo — 12 arquivos, 500×500

Cada penteado são **três cores**, e o sufixo do arquivo diz qual: `cast`
(castanho), `pre` (preto), `bran` (branco), `rosa`.

| Penteado | Arquivos, em `public/assets/catalog/avatars/hair/` |
|---|---|
| Rabo de Cavalo | `CABELO_T1_RABO_DE_CAVALO_cast.png` · `_pre.png` · `_bran.png` |
| Coque Solto | `CABELO_T2_COQUE_SOLTO_cast.png` · `_pre.png` · `_bran.png` |
| Undercut | `CABELO_T3_UNDERCUT_cast.png` · `_pre.png` · `_bran.png` |
| Trança Lateral | `CABELO_T4_TRANCA_LATERAL_cast.png` · `_bran.png` · `_rosa.png` |

**O cabelo tem um passo a mais que a roupa não tem.** Ele encaixa na cabeça por
uma tabela de deslocamento (`constants/avatarOffsets.ts`), e o valor só pode ser
medido no desenho de verdade — os doze estão sem entrada, o que significa
"centralizado, tamanho natural". Quando a arte chegar, o encaixe se acerta em
`tools/avatar-align.html`, que lê do arquivo e devolve o bloco para colar.

### Ainda sem placeholder

Estes dois não têm arquivo nenhum: aparecem como emoji no app.

| Peça | Onde |
|---|---|
| Borda Soberano | prêmio do degrau 10 |
| Empreendedor | roupa épica, só baú |

### Wallpaper e jardim

As **4 wallpapers** e as **4 peças de jardim** ainda não têm item criado nem
nome de arquivo — os degraus delas não foram decididos. Ficam para quando forem.

---

## A conta

| Categoria | Hoje | Depois | Desenhos |
|---|---|---|---|
| **Roupa** | 19 | 28 | **14** |
| Cabelo | 8 | 12 | **4** |
| Wallpaper | 6 | 10 | **4** |
| Jardim (3D) | 15 peças | 19 | **4** |
| | | | **26** |

E mais **7 fundos de grupo**, um por patente — ver *6 · Fundo do grupo*. Eles
acabam junto com as 26, e sao o premio de o grupo subir.

E, fora desta conta, **5 por temporada nova** — skin, borda, banner, insígnia e a
vitrine do tema. As 26 acabam; essas cinco voltam sempre.

A ordem, se for em partes:

1. **Soberano** — o topo da escada entrega um emoji hoje
2. **as outras oito da escada** — é o que faz a regra dos nomes existir
3. **as quatro do pacote inicial** — as primeiras 100 horas de todo mundo
4. o resto
