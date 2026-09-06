# Prompt — as quatro páginas base do Glyph

Data: 2026-09-03
Para: a outra IA (frente visual)
Como usar: copie o bloco abaixo inteiro e mande para ela. O resto deste arquivo
é contexto para você, Afonso, não precisa mandar.

---

## Por que quatro, e por que geradas

Você quer quatro páginas para consultar sempre, e que digam a verdade sobre o
app. Página escrita à mão mente em uma semana — foi exatamente o que aconteceu
com `docs/drafts/reward-modal-4-direcoes.html`: ela mostra a recompensa de
patente com conteúdo inventado, então o caso do resgate com quatro métricas
nunca apareceu, e o desenho quebrou lá justamente porque a folha não tinha esse
caso.

A saída é a mesma que já funcionou com as temporadas: **um script lê o código e
cospe o HTML**. `scripts/build-season-sheet.mjs` faz isso e produz
`docs/temporadas.html`, um arquivo único que abre com dois cliques e tem as
imagens embutidas. As quatro páginas seguem esse molde.

A divisão de trabalho: **ela desenha a base** (o HTML/CSS de cada página, com
dados de exemplo marcados), **eu escrevo o gerador** que substitui os exemplos
pelos dados reais do código. Assim o desenho é dela e a verdade é do código.

---

## BLOCO PARA COPIAR

```
Preciso de quatro páginas HTML base para o Glyph. Elas vão ser regeneradas por
script a partir do código do app, então o que eu preciso de você é o DESENHO de
cada uma — HTML e CSS — com os dados de exemplo claramente marcados para eu
trocar por dados reais depois.

Regras que valem para as quatro:

- Arquivo único, sem build, sem rede. Abre com dois cliques no Windows.
- Nada de CDN, nada de fonte externa: use pilha de fontes do sistema.
- Escuro por padrão. O app é escuro.
- Todo dado de exemplo marcado com {{CHAVE}} para o gerador substituir. Nunca
  invente número: se não souber, deixe {{}} com um comentário dizendo o que
  entra ali.
- Cada bloco de dados precisa dizer DE ONDE veio (nome do arquivo do código).
  A página é referência de trabalho, não peça de marketing.
- Largura útil de 1100px, mas que não quebre em 800.
- Tabelas longas rolam dentro do próprio container, a página nunca rola de lado.

As quatro páginas:

1. MODAIS DE RECOMPENSA
   Os seis acontecimentos na mesma placa: resgate de código, missão concluída,
   ciclo fechado, quest de temporada, conquista Genesis e subida de patente.
   Cada um com seu emblema PNG e seu tom. Mostre os seis lado a lado, e mostre
   os casos que quebram: um com quatro métricas, um com seis itens, um com
   faixa de destaque, um com métrica sem símbolo. Inclua as quatro direções de
   placa (A Fissura, B Monólito, C Santuário, D Bipartido) para comparação.
   Marcadores: {{EMBLEMA_*}}, {{TOM_*}}, {{METRICAS_*}}, {{ITENS_*}}.

2. CATÁLOGO E INVENTÁRIO
   Os 143 itens por categoria — skin, cabelo, insígnia, borda, banner, tema,
   artefato, glifo, orbe, placa, aura — com a arte real, o nome, a raridade na
   cor oficial, e um aviso em quem ainda está sem PNG. No topo, um placar: quantos
   itens, quantos com arte, quantos sem. Os oito baús com nome exibido e cor.
   Marcadores: {{ITENS_POR_CATEGORIA}}, {{PLACAR}}, {{BAUS}}.

3. TEMPORADAS
   As treze temporadas na linha do tempo, cada uma com as cinco peças da coleção
   (skin, borda, banner, tema, insígnia), as cores, as datas e o fundo vertical.
   Deixe evidente o que está vazio: onze das treze ainda estão. Um recorte
   mostrando como o fundo aparece nos três lugares que cortam ele (card do
   Mundo, modal de detalhe, modal de transição).
   Marcadores: {{TEMPORADAS}}, {{PECAS_*}}, {{FUNDO_*}}.

4. ALINHAMENTO DO AVATAR
   O boneco com as camadas na ordem em que o app desenha (placa, aura, corpo,
   rosto, roupa, cabelo, artefato, glifo, orbe), a tabela de ajustes por peça
   (x, y, escala, recortes) e as regiões do corpo que uma roupa pode cobrir.
   Mostrando corpo masculino 1 e feminino 5, que são os dois que ficam.
   Marcadores: {{CAMADAS}}, {{AJUSTES}}, {{REGIOES}}.

A paleta canônica de raridade, que vale nas quatro (de
constants/rarityVisuals.ts):

  Comum      #9CA3AF
  Incomum    #22C55E
  Raro       #3B82F6
  Épico      #A855F7
  Lendário   #F59E0B
  Mítico     #7B61FF   (é a raridade de temporada)
  Temporada  #14B8A6   (quest)

Os tons por acontecimento, para a página 1 (de constants/rewardEmblems.ts):

  geral      245,158,11   âmbar
  missão     148,163,184  prata
  ciclo      184,115,51   bronze
  temporada  20,184,166   verde-água
  genesis    123,97,255   violeta
  patente    a cor da raridade da insígnia da patente atingida

Se alguma dessas quatro páginas já existir de algum jeito no repositório,
prefira melhorar a existente a criar uma quinta. Já temos artefato demais.
```

---

## O que eu faço depois que ela entregar

Um gerador por página, no mesmo molde do de temporadas:

| Página | Gerador | Lê de |
|---|---|---|
| Modais | `scripts/build-modal-sheet.mjs` | `constants/rewardEmblems.ts`, `rewardPlateStyles.ts`, os três construtores de payload |
| Catálogo | `scripts/build-catalog-sheet.mjs` | `constants/items.ts`, `catalogAssets.ts`, `rarityVisuals.ts` |
| Temporadas | `scripts/build-season-sheet.mjs` *(já existe)* | `constants/seasonContent.ts` |
| Alinhamento | `scripts/build-avatar-sheet.mjs` | `constants/avatarOffsets.ts`, `components/CanvasAvatar.tsx` |

E um comando só que regenera as quatro, para nenhuma envelhecer sozinha:

```bash
npm run folhas
```

Enquanto elas não existirem, a **bancada** (`npm run bancada`, localhost:3010)
já mostra as quatro coisas com o componente real — a diferença é que ela precisa
do servidor rodando, e as folhas abrem com dois cliques e podem ser lidas por
quem não tem o projeto.
