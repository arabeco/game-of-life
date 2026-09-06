# Continuidade — assets das temporadas

## Estado confirmado

- `docs/temporadas.html` mostra as 13 temporadas.
- `tools/season-editor.html` e `tools/season-editor.tsx` são o editor local.
- Os valores atuais de `backgroundUrl` estão errados conceitualmente: apontam para os ícones quadrados de tema UI (`genesis.png`, `aurora.png`, `gold.png`, `void.png` e `frost.png`).
- Esses cinco arquivos têm aproximadamente 500 × 500 px, composição circular e não são fundos de temporada.
- Aurora, Zênite, Eclipse e Égide repetem os mesmos arquivos nas eras seguintes; não são fundos inéditos.
- Auditoria visual corrigiu o placar para 6 PNGs prontos: as 5 peças de Genesis e somente a skin de Aurora I. `insignia_season_aurora_1` existe no cadastro, mas ainda não possui `imageUrl` nem PNG dedicado.
- Aurora I ainda precisa de borda, banner, tema UI e insígnia próprios.

## Paleta-base das famílias

| Família | Primária | Secundária |
| --- | --- | --- |
| Genesis | `#b07ce8` | `#41215f` |
| Aurora | `#668679` (provisória) | `#17231f` (provisória) |
| Zênite | `#efbc4b` | `#69490c` |
| Eclipse | `#8f63f0` | `#2d1b54` |
| Égide | `#7cc3e8` | `#1f485c` |

- A paleta é da família e continua nas eras I, II e III.
- Cada temporada ainda precisa de arte e composição próprias; compartilhar cor não autoriza repetir o mesmo PNG.
- A cor-base orienta fundo, reflexos, títulos, bordas, gradientes, skin, borda, banner, tema UI e insígnia.
- Genesis e Eclipse são roxos diferentes: Genesis é violeta primordial; Eclipse é mais frio e noturno.
- Os pares já estão visíveis em `docs/temporadas.html`. O cadastro possui `theme` e prevê `cores`, mas as entradas de `constants/seasonContent.ts` ainda não trazem os pares explicitamente.
- O par antigo de Aurora (`#5fd9c4` / `#1a5951`) foi rejeitado: saturado e turquesa demais para uma skin UI sóbria.
- A direção escolhida por enquanto é **Jade Fumê**: metal `#668679`, base grafite-verde `#17231f`, prata `#b7c3bc` e esmeralda de acento `#3f8f5b`. A prévia está em `docs/drafts/aurora-i-paletas.html`.
- O verde deve ficar principalmente nas pedras e acentos; metal dessaturado e grafite-verde ocupam a maior parte das superfícies.

## Onde o fundo aparece

- Card **Temporada atual**, na aba Mundo: faixa horizontal com `background-size: cover`.
- Modal de detalhes da temporada: área máxima aproximada de 520 × 236 px, com `object-cover`.
- Modal de transição, tanto temporada encerrada quanto nova temporada: área aproximada de 540 × 220 px, com `object-cover`.
- Apesar desses recortes, o asset final deve ser um PNG vertical. O ponto focal precisa ficar no eixo central para sobreviver aos cortes horizontais.

## Rascunho preservado

- Primeiro fundo vertical verdadeiro de Genesis: `docs/drafts/season-genesis-background-v1.png`.
- Direção: santuário primordial de obsidiana, violeta profundo, veios discretos de ouro antigo e fenda vertical de luz de criação.
- É rascunho para avaliação; ainda não foi ligado ao `seasonContent.ts` nem substitui o ícone do tema UI.
- `docs/drafts/season-aurora-i-background-v1.png`: rejeitado por ficar cinza e genérico demais; preservar apenas como histórico.
- `docs/drafts/season-aurora-i-background-v2.png`: novo fundo vertical 1024 × 1536 em Jade Fumê, com portal monumental, aurora verde e reflexos centrais; aguardando aprovação final.
- `docs/drafts/insignia-season-aurora-i-v1.png`: insígnia Aurora I aprovada visualmente; possui alpha real, ainda não integrada.
- `docs/drafts/borda-season-aurora-i-v1.png`: borda Aurora I aprovada visualmente; possui alpha real, ainda não integrada.
- `docs/drafts/banner-season-aurora-i-v2.png`: banner Aurora I aprovado visualmente; ainda exige extração/refação do fundo porque o xadrez foi gravado no RGB e não existe alpha real.
- `docs/drafts/ui-skin-aurora-i-orb-v1.png`: primeira bola da Skin UI Aurora I, com alpha real; usa véus verticais em vez do vórtice repetido das skins antigas.
- `docs/drafts/aurora-i-orbe-nivel.html`: compara a bola nova em 56 px, com o número real sobreposto, contra Ouro, Gelo, Chama, Aurora antiga e Genesis; inclui modos claro e escuro.

## Próximo passo

1. Avaliar o rascunho Genesis nos recortes do card e dos dois modais.
2. Avaliar `docs/drafts/season-aurora-i-background-v1.png` nos mesmos recortes.
3. Aprovar ou ajustar apenas Genesis e Aurora I.
4. Separar os `backgroundUrl` dessas duas temporadas dos assets de tema UI.
5. Não produzir Zênite, Eclipse, Égide nem eras II/III nesta etapa.
