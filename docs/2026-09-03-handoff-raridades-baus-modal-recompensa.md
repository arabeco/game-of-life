# Handoff — assets, raridades, baús, insígnias, temporadas e modal de recompensa

Data: 2026-09-03

Este documento registra as decisões visuais e as alterações desta frente para outra IA continuar sem desfazer o que já foi aprovado.

## Limite de edição

- Não sobrescrever nem reestruturar `components/RewardPackModal.tsx` ou `components/VanguardWelcomeModal.tsx` enquanto houver outra IA trabalhando neles.
- A exploração visual isolada está em `docs/drafts/reward-modal-4-direcoes.html`.
- Ao integrar a direção aprovada, transportar as regras abaixo para o modal real sem copiar cegamente a geometria da sheet.

## Regra canônica de raridade

| Tier | Chave | Nome visível | Cor |
|---:|---|---|---|
| 1 | `common` | Comum | `#9CA3AF` |
| 2 | `uncommon` | Incomum | `#22C55E` |
| 3 | `rare` | Raro | `#3B82F6` |
| 4 | `epic` | Épico | `#A855F7` |
| 5 | `legendary` | Lendário | `#F59E0B` |
| 6 | `mythic` | Mítico | `#7B61FF` |

`constants/rarityVisuals.ts` é a fonte central. Foram corrigidos os acentos dos rótulos e criados helpers para nome, tier e raridade visual dos baús.

## Mapa dos baús

| Tipo persistido | Nome para o jogador | Tier visual | Arte |
|---|---|---:|---|
| `Comum` | Baú Comum | 1 | `bau_normal.png` |
| `Incomum` | Baú Incomum | 2 | `bau_incomum.png` |
| `Raro` | Baú Raro | 3 | `bau_prata.png` |
| `Épico` | Baú Épico | 4 | `bau_ouro.png` |
| `Lendário` | Baú Lendário | 5 | `bau_lendario.png` |
| `Season` | Baú Mítico | 6 | `bau_epico.png` |
| `Ciclo` | Baú de Ciclo | 3 | `bau_prata.png` |
| `Skin Comum` | Baú de Skin Comum | 1 | `bau_normal.png` |

Importante: `Season` continua sendo a chave de dados/backend. Apenas o nome exibido e a raridade visual são Mítico. Não renomear a chave persistida sem migração coordenada.

### Baú Incomum novo

- Arquivo: `public/assets/catalog/interface/bau_incomum.png`
- 512 × 512, PNG RGBA, fundo transparente real.
- Direção: madeira escura, aço escovado, uma gema verde pequena; mais refinado que o Comum e mais humilde que o Raro.
- Criado com a ferramenta embutida de geração de imagem, usando `bau_normal.png` e `bau_prata.png` como referências de família.

## Insígnias PNG concluídas

Existem **14 PNGs de insígnia produzidos** em `public/assets/catalog/interface/`: dez patentes e quatro conquistas. São peças pequenas, físicas, do tamanho da palma da mão — broches/pingentes metálicos — e não escudos grandes nem objetos de cenário.

### Dez patentes

Ordem final:

1. `insignia_rank_1_vagante.png`
2. `insignia_rank_2_escudeiro.png`
3. `insignia_rank_3_cavaleiro.png`
4. `insignia_rank_4_lorde.png`
5. `insignia_rank_5_barao.png`
6. `insignia_rank_6_conde.png`
7. `insignia_rank_7_duque.png`
8. `insignia_rank_8_principe.png`
9. `insignia_rank_9_rei.png`
10. `insignia_rank_10_soberano.png`

Decisões visuais:

- a 7 e a 8 foram trocadas; os arquivos acima já representam a ordem final;
- as patentes pertencem à mesma família, porém não repetem exatamente o mesmo contorno;
- variar bordas entre formato alongado, redondo, losango, pequeno escudo e recortes mais serrilhados, sem transformar cada uma em um objeto diferente;
- prata fica concentrada nas patentes iniciais; da progressão intermediária em diante entram ouro antigo, branco, azul escuro, roxo e pedras controladas;
- as patentes superiores podem misturar pequenas pedras de outras cores, mas sem estética carnavalesca ou excesso de ornamento;
- a 10 pode ser mais exuberante por ser o ápice.

### Quatro insígnias de conquista

| Função | Arquivo | Direção |
|---|---|---|
| Ciclos, acumulável | `insignia_ciclo_bronze.png` | Bronze; a mesma arte recebe quantidade/progresso |
| Missões individuais ou iniciais, acumulável | `insignia_missao_prata.png` | Prata; mesma família da anterior |
| Quests entre temporadas | `insignia_quest_temporada.png` | Roxo predominante, menos azul; genérica e reutilizável |
| Temporada Genesis | `insignia_season_genesis.png` | Exclusiva, roxo/rosa escuro, ouro realista e branco; uma única pedra central |

As três primeiras compartilham a mesma família visual. A Genesis mantém parentesco, mas tem contorno próprio, fechado e mais nobre. Não deve virar um losango genérico nem ser preenchida inteira por pedra. A riqueza vem da forma e dos materiais, não de encher a peça de detalhes.

Integração pendente para a outra IA: associar esses quatro arquivos aos itens corretos do `ITEMS_DB`; não redesenhar nem substituir os PNGs durante essa integração.

## Temporadas — estado e plano dos PNGs

Há **13 temporadas** na linha do tempo:

- Temporada 0 — Genesis;
- Aurora I, Zênite I, Eclipse I e Égide I;
- Aurora II, Zênite II, Eclipse II e Égide II;
- Aurora III, Zênite III, Eclipse III e Égide III.

Cada temporada possui uma coleção de cinco peças: **skin, borda, banner, tema UI e insígnia**. Auditoria visual posterior corrigiu o placar: há **6 PNGs efetivamente prontos**, não 7. A Genesis possui sua coleção e Aurora I possui somente a skin `SKIN_QUEST_GUARDIAO_AURORA.png`. O item `insignia_season_aurora_1` existe no cadastro, mas não possui `imageUrl` nem PNG dedicado. Borda, banner, tema UI e insígnia de Aurora I ainda faltam. Esse placar deve ser recalculado após cada novo lote.

### Identidade cromática por família

A cor-base pertence à **família sazonal** e se repete nas eras I, II e III. Ela deve orientar fundos, reflexos metálicos, títulos, bordas, gradientes e as cinco peças da coleção, sem obrigar artes repetidas ou uma composição monocromática.

| Família | Primária | Secundária | Leitura visual |
| --- | --- | --- | --- |
| Genesis | `#b07ce8` | `#41215f` | violeta primordial, com roxo profundo; pode receber ouro antigo em detalhes nobres |
| Aurora | em revisão | em revisão | o antigo `#5fd9c4` / `#1a5951` foi rejeitado por ficar turquesa/neon e brega na UI |
| Zênite | `#efbc4b` | `#69490c` | âmbar solar sobre bronze/marrom profundo |
| Eclipse | `#8f63f0` | `#2d1b54` | roxo frio e noturno, mais sombrio que Genesis |
| Égide | `#7cc3e8` | `#1f485c` | azul-gelo sobre azul mineral escuro |

Esses pares já aparecem em `docs/temporadas.html`. Em `constants/seasonContent.ts`, o campo `theme` identifica a família e a interface prevê `cores?: { primaria; secundaria }`, mas as entradas ainda não possuem `cores`. A outra IA deve preencher e consumir esses valores quando integrar a identidade visual; não deve deduzir cor a partir dos PNGs nem deixar todas as temporadas no dourado padrão.

**Revisão de Aurora:** o antigo verde-água `#5fd9c4` foi rejeitado por parecer saturado e genérico demais para uma skin UI. A direção provisoriamente escolhida é **Jade Fumê**: metal principal `#668679`, base grafite-verde `#17231f`, prata dessaturada `#b7c3bc` e esmeralda de detalhe `#3f8f5b`. O verde não deve preencher todas as superfícies; fica concentrado nas pedras e nos acentos. Prévia: `docs/drafts/aurora-i-paletas.html`.

O botão mostrado nessa prévia segue a geometria real do jogo: `.luxe-skin-button` combinado com `rounded-xl` (raio de 12 px), brilho especular curto no topo, gradiente da skin, borda tonal e sombra/glow. Não usar botão quadrado como identidade de Aurora.

Aurora/Jade Fumê também precisa funcionar em **modo claro e escuro**. A arquitetura atual de `buildUiSkinTokens(skinId, theme)` mantém `buttonBackground` e `buttonText` entre os modos, enquanto recalcula superfícies, textos auxiliares, bordas e glow. Para Jade Fumê, o modo claro deve usar prata esverdeada clara nos painéis e texto grafite; não deve transformar a interface em verde-claro. A comparação dos dois modos está no fim da prévia de paletas.

Para Aurora I, comparar as alternativas em `docs/drafts/aurora-i-paletas.html` antes de fixar novos hexadecimais. Direção visual: prata envelhecida e aço/grafite-petróleo formam a massa; verde-esmeralda aparece apenas como acento nas pedras e pequenos focos. A paleta precisa funcionar em superfícies e botões de skin UI, não apenas parecer bonita como amostra isolada.

As eras de uma mesma família mantêm a paleta, mas precisam receber artes próprias. Cor repetida é continuidade de identidade; arquivo e composição repetidos seriam reaproveitamento indevido.

### Fundos sazonais

O `backgroundUrl` atual está conceitualmente errado: ele aponta para ícones quadrados/circulares de tema UI (`genesis.png`, `aurora.png`, `gold.png`, `void.png`, `frost.png`). Esses arquivos **não são fundos de temporada** e não podem ser reutilizados como se fossem paisagens.

Cada temporada receberá um **PNG vertical inédito**, separado do tema UI. O ponto focal deve permanecer no eixo central porque a mesma arte sofre recortes horizontais em três lugares:

- card “Temporada atual” na aba Mundo;
- modal de detalhes da temporada;
- modal de transição entre temporada encerrada e nova temporada.

Primeiro rascunho preservado: `docs/drafts/season-genesis-background-v1.png`. Direção: santuário primordial de obsidiana, violeta profundo, veios discretos de ouro antigo e fenda vertical de criação. Ainda precisa ser avaliado nos três recortes antes de virar asset definitivo.

### Escopo decidido agora

Produzir e integrar **somente Genesis e Aurora I**. Não gerar nem registrar fundos ou coleções de Zênite, Eclipse, Égide ou das eras II e III nesta etapa.

Fundos preservados para avaliação:

1. `docs/drafts/season-genesis-background-v1.png` — Genesis;
2. `docs/drafts/season-aurora-i-background-v1.png` — Aurora I, rejeitado por ficar cinza/genérico;
3. `docs/drafts/season-aurora-i-background-v2.png` — Aurora I em Jade Fumê, 1024 × 1536, aguardando aprovação final.

Novos rascunhos da coleção Aurora I:

- `docs/drafts/insignia-season-aurora-i-v1.png` — aprovada visualmente, alpha real;
- `docs/drafts/borda-season-aurora-i-v1.png` — aprovada visualmente, alpha real;
- `docs/drafts/banner-season-aurora-i-v2.png` — aprovada visualmente, mas ainda com falso xadrez no RGB; não integrar até obter alpha verdadeiro.
- `docs/drafts/ui-skin-aurora-i-orb-v1.png` — proposta de bola da Skin UI Aurora I com alpha real, véus verticais e centro escuro para o número;
- `docs/drafts/aurora-i-orbe-nivel.html` — prova visual em 56 px com o mesmo número, contorno e sombra de `Sephirot.tsx`, incluindo claro/escuro e comparação com temas antigos.

Próximos passos limitados:

1. validar os dois fundos nos três recortes reais;
2. aprovar ou ajustar apenas Genesis e Aurora I;
3. a outra IA integra apenas esses dois `backgroundUrl` e as peças já existentes das duas temporadas;
4. as outras onze temporadas permanecem documentadas, mas fora do escopo atual.

## Regras do modal de recompensa

Direção escolhida: **B — Monólito Central**.

Refinamentos aprovados sobre o B:

- usar o suporte quadrado com cantos chanfrados do ícone da direção D, sem o losango girado;
- remover completamente a faixa vertical luminosa que atravessava o centro;
- engrossar a moldura em várias camadas, com lateral deslocada e sombra curta para o modal parecer uma placa física que poderia ser segurada na mão;
- preservar a hierarquia vertical e o recorte simétrico do Monólito Central.

1. O plano de fundo do modal é grafite/preto metálico e recebe um gradiente escuro baseado no tipo da recompensa ou na cor da insígnia.
2. A cor da recompensa não deve pintar o modal inteiro; funciona como reflexo de metal, mais visível perto do topo e muito fraco no restante.
3. O botão não herda a raridade. Ele usa sempre a Skin UI equipada pela pessoa.
4. O botão deve usar a linguagem real de `.luxe-skin-button`: brilho branco superior + `var(--ui-button-primary-bg, var(--metal-gold))`, borda `var(--skin-accent-color)` e glow da Skin UI.
5. Cada item usa sua própria raridade no quadrado da arte: gradiente escuro tingido, borda discreta e rótulo textual na mesma cor.
6. Métricas como EXP e patente também ficam em quadrados, seguindo a estrutura aprovada na sheet.

## Arquivos alterados nesta frente

- `public/assets/catalog/interface/bau_incomum.png`: novo asset.
- `constants/catalogAssets.ts`: Incomum deixou de reutilizar `bau_normal.png`.
- `constants/rarityVisuals.ts`: nomes acentuados; `Season` agora resolve para Mítico; helpers de baú.
- `components/Store/Inventory.tsx`: baús recebem nome, tier e raridade centralizados; `Season` aparece como MÍTICO.
- `components/ItemDetailModal.tsx`: cores e rótulos passaram a usar a fonte central, incluindo Mítico.
- `views/ProfileView.tsx`: removida a paleta antiga marrom/prata/ouro/azul/roxo.
- `index.css`: glow das classes plasma alinhado à paleta canônica e adicionado T6 Mítico.
- `docs/drafts/reward-modal-4-direcoes.html`: amostras reais dos seis tiers, gradientes individuais dos itens, fundo do modal por recompensa e botão baseado na regra real de `.luxe-skin-button`.

## Estado de validação

- O asset novo foi conferido em 512 × 512 com canal alpha e cantos transparentes.
- Rodar `npm run type-check` e revisar a sheet após qualquer integração no modal real.
- Não considerar o modal real finalizado a partir da sheet; a sheet é direção visual e comparação.

## Mapa real dos modais de recompensa

Este esclarecimento é importante: **não existem seis modais independentes para
serem redesenhados**. Existe uma família compartilhada, com duas molduras
player-facing, e vários acontecimentos alimentando o mesmo miolo.

### O que existe no código

| Componente | Papel real | Onde aparece |
|---|---|---|
| `components/RewardPackBody.tsx` | Miolo canônico da recompensa: título, métricas, itens, vantagens e raridades | Compartilhado pelos dois modais abaixo |
| `components/RewardPackModal.tsx` | Moldura genérica de entrega de recompensa | presente/doação recebida, ativação Premium, prêmio final do beta, baú aberto e fechamento de ciclo |
| `components/AchievementModal.tsx` | A mesma família de recompensa, mas com cerimônia opcional de vídeo e compartilhamento | marco, arena, patente, quest/desafio, relatório/ciclo, competição e patente do grupo |
| `components/VanguardWelcomeModal.tsx` | Adaptador de conteúdo da Vanguarda | Por dentro apenas chama `RewardPackModal`; não é uma terceira linguagem visual |

Há também `RewardPackModal` no Painel Soberano, porém aquele ponto é somente
preview de GM para Premium/Platinum, não uma nova modalidade entregue ao
jogador.

### O que parece recompensa, mas não é esse modal

| Componente | O que realmente é |
|---|---|
| `components/DailyCompletionPromptModal.tsx` | Aviso de tarefa concluída ou convite para abrir o Resumo Diário. Pode mostrar EXP já depositada, mas não é tela de resgate de recompensa. |
| `components/CodexClaimModal.tsx` | Recebimento/importação de uma campanha compartilhada. Não é resgate de código promocional. |
| `components/RewardVideoPreviewModal.tsx` | Ferramenta de QA para assistir aos vídeos de patente e relatório sem conceder nada. |
| `components/ChestOpeningModal.tsx` | Foi removido. O baú agora abre no Inventário e o resultado usa `RewardPackModal`. |

### O resgate que estava faltando na lembrança

O resgate de código promocional existe em
`views/SettingsView.tsx`, função `handleRedeemCode`, mas **hoje termina apenas em
`showToast(...)`**. Portanto:

- ainda não existe uma apresentação completa de recompensa para resgate de
  código;
- não existe hoje um sistema/modal genérico de “recompensa diária”;
- o check-in diário do beta é outra coisa: ao completar 14 de 14, a recompensa
  final já cai no `RewardPackModal`;
- se for criada no futuro uma recompensa diária de verdade, ela deve alimentar
  o mesmo `RewardPackModal`, não ganhar outro componente duplicado.

### PNG geral já criado e ainda não integrado

Existe o arquivo
`public/assets/catalog/interface/recompensa_geral.png`. É a peça laranja/dourada
com gema central feita para representar **recompensa genérica**: resgate de
código, doação/presente, bônus geral e eventual recompensa diária. O arquivo
está pronto, mas atualmente possui **zero referências no código**.

### Emblemas aprovados por acontecimento

Não criar seis placas ou seis modais. Usar estes PNGs como emblema superior da
mesma placa Monólito Central e mudar apenas conteúdo, reflexo metálico e tom do
acontecimento:

| Acontecimento | Emblema |
|---|---|
| Recompensa genérica, presente/doação, resgate de código ou futuro prêmio diário | `recompensa_geral.png` |
| Missão individual/inicial concluída | `insignia_missao_prata.png` |
| Ciclo ou relatório concluído | `insignia_ciclo_bronze.png` |
| Quest de temporada concluída | `insignia_quest_temporada.png` |
| Conquista exclusiva da Genesis | `insignia_season_genesis.png` |
| Subida de patente | `insignia_rank_1_vagante.png` até `insignia_rank_10_soberano.png`, conforme a patente atingida |

Hoje o `AchievementModal` ainda põe emoji no suporte superior em vários desses
casos. Os PNGs podem aparecer como item recebido, mas isso não significa que o
emblema do topo já esteja integrado. Essa ligação continua pendente.

### Orientação para a implementação

1. Manter `RewardPackBody` como miolo único.
2. Aplicar a direção aprovada **B — Monólito Central** às molduras reais de
   `RewardPackModal` e `AchievementModal`, sem criar cópias por acontecimento.
3. Introduzir uma configuração de tipo de recompensa que forneça emblema, tom
   do gradiente metálico e textos; o botão continua vindo da Skin UI equipada.
4. No sucesso de `handleRedeemCode`, montar um `RewardModalPayload` com o retorno
   real do RPC e abrir `RewardPackModal` com `recompensa_geral.png`, substituindo
   o toast como apresentação principal.
5. Presente/doação pode usar o mesmo emblema geral. Missão, ciclo, temporada e
   patente usam suas insígnias próprias conforme a tabela.
6. Não transformar `DailyCompletionPromptModal` em recompensa diária: ele tem
   função diferente e deve continuar leve.
