# Entrega de arte 2D: skins e cabelos

Estado em 22/09/2026. Escopo desta execução: somente **skins e cabelos**. Fundos, wallpapers, borda e jardim ficaram fora.

## Arquivos entregues

- **14 skins** em `public/assets/catalog/avatars/`: as 13 com placeholder do handoff mais `SKIN_T4_EMPREENDEDOR.png`.
- **12 cabelos** em `public/assets/catalog/avatars/hair/`: quatro cortes em três cores cada.
- `npm run arte:pendente`: **nenhum placeholder restante**.
- Todos os 26 arquivos finais foram verificados como PNG **500 × 500 com alpha**.
- `npm run build`, `npx tsc --noEmit` e `npm run test:item-art`: passaram. Não houve teste no Android.
- Nenhum offset, corpo, regra de desbloqueio, raridade ou preço foi alterado. O item Empreendedor ganhou somente a referência ao PNG em `constants/items.ts`.

Os originais da geração estão em `art-delivery/2d/skins/originals/` e `art-delivery/2d/hair/originals/`. Os arquivos normalizados e as folhas `<nome>.review.png` ficam em `art-delivery/2d/skins/candidates/` e `art-delivery/2d/hair/candidates/`. Cada folha mostra a peça sobre `body_masc_1..4` e `body_fem_1..4`.

## Revisão visual das skins

Todas as skins foram colocadas no catálogo a pedido de concluir os arquivos antes dos offsets. **Isso não significa que o encaixe esteja finalizado.** Nas folhas de composição ainda há pele de ombro/braço/perna ou pontas de pé escapando em várias peças. O Pijama teve a gola traseira removida; a Chuva usa a versão `v2`, sem o arco de capuz que atravessava a cabeça. Nenhuma skin deve ser considerada aprovada para release visual até uma segunda QA após os ajustes de encaixe.

| Skin | Fonte integrada em `art-delivery/2d/skins/candidates/` | Principal pendência visual |
|---|---|---|
| Pijama | `SKIN_T1_PIJAMA-draft.png` | Sem gola traseira; revisar no app. |
| Corrida | `SKIN_T1_CORRIDA-draft.png` | Tênis não cobre completamente alguns pés femininos. |
| Chuva | `SKIN_T1_CHUVA-v2.png` | Capuz traseiro resolvido; ombros e mangas precisam encaixe. |
| Verão | `SKIN_T1_VERAO-draft.png` | Ombros e pontas de pé aparentes. |
| Escudeiro | `SKIN_T1_ESCUDEIRO-draft.png` | Braço/perna escapam na base feminina. |
| Cavaleiro | `SKIN_T2_CAVALEIRO-draft.png` | Braço e pé aparentes. |
| Lorde | `SKIN_T2_LORDE-draft.png` | Ombros e pés aparentes. |
| Barão | `SKIN_T2_BARAO-draft.png` | Pés e braço aparentes. |
| Conde | `SKIN_T3_CONDE-draft.png` | Ombros e pés aparentes. |
| Duque | `SKIN_T3_DUQUE-draft.png` | Pés aparentes. |
| Príncipe | `SKIN_T4_PRINCIPE-draft.png` | Ombros e pés aparentes. |
| Rei | `SKIN_T4_REI-draft.png` | Pés aparentes. |
| Soberano | `SKIN_T5_SOBERANO.png` | Pequenas partes do corpo aparentes fora da roupa. |
| Empreendedor | `SKIN_EMPREENDEDOR-draft.png` | Ombros, braços e pés precisam encaixe. |

## Cabelos entregues

Todos foram gerados pelo gerador embutido, com base castanha e edições de cor da mesma geometria. A arte foi normalizada no quadro de 500 × 500 e cada cor inspecionada sobre os oito corpos.

- `CABELO_T1_RABO_DE_CAVALO_{cast,pre,bran}.png`
- `CABELO_T2_COQUE_SOLTO_{cast,pre,bran}.png`
- `CABELO_T3_UNDERCUT_{cast,pre,bran}.png`
- `CABELO_T4_TRANCA_LATERAL_{cast,bran,rosa}.png`

## Método e limite da validação

Ferramenta: `imagegen` embutida. Família de prompts para skins: roupa frontal vestível, sem corpo/cabeça/pele, alpha real, sem parte traseira de gola/capuz/manga, usando os corpos como guia. Família de prompts para cabelos: corte isolado, abertura transparente para rosto, textura compatível com os cabelos existentes; variantes editadas só na cor. A normalização com `sharp` apenas reduziu e posicionou a imagem, sem deformação não uniforme.

As folhas de revisão são composição local, não prova de renderização do CanvasAvatar no navegador ou Android. A etapa seguinte é corrigir os encaixes ainda visíveis nas skins e verificar as peças no app. Os offsets foram deixados intactos conforme pedido.
