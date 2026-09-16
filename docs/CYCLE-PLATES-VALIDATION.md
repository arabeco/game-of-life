# Placas de ciclo — aplicação do estilo aprovado

Data: 2026-09-16.

O componente compartilhado `components/MetalReportCard.tsx` passou a usar moldura chanfrada, louros PNG finos, título serifado, rótulos e valores centralizados e acabamento escuro. Os sete acabamentos são E, D, C, B, A, S e SS. O PNG está em `public/assets/cycles/laurel-silver.png` e é incluído no build.

## Cinco pontos de uso

- Ciclo ativo: `views/ReportsView.tsx`, preservando progresso e tempo.
- Histórico: `views/ReportsView.tsx`, modo compacto.
- Encerramento: `components/ReportResultCarousel.tsx`, preservando recompensas, captura e brilho de entrada. Usa o nome do ciclo; o conteúdo pode rolar quando excede a altura disponível.
- Cena do legado: `components/LegacyProjectionScene.tsx`, mesmo compacto do histórico.
- Exportação do legado: `components/LegacyExportKit.tsx`, preservando resumo, métricas e datas, com largura máxima de 440px.

## Evidências locais

- Build Vite: passou. Log em `cycle-plate-build.log`.
- Testes `cycle-legacy-seal.regression.mjs` e `reward-routing.regression.mjs`: passaram.
- Checagem TypeScript isolada do componente: passou.
- TypeScript geral: falha em outras partes, incluindo App.tsx, ActionModal.tsx, contratos de RewardPackModal e GameContext. Não é uma aprovação geral de tipos do projeto.
- Galeria `docs/drafts/cycle-plates-all.html` usa o componente real e dados ilustrativos.
- Sete versões normais e sete compactas renderizadas; PNG carregado, sem overflow horizontal nas placas e métricas centralizadas.
- Cinco configurações representativas renderizadas: ativo, histórico, encerramento com recompensas, legado com nome longo e exportação com métricas longas. Conteúdo dentro das placas.
- Exportação via html-to-image na galeria: PNG de 880 × 1458 inspecionado, com ramo, título e texto longo legíveis.

## Limites

Os cinco pontos estão ligados ao componente no código. A verificação visual foi feita na galeria com dados ilustrativos, não nos cinco fluxos autenticados completos. Não houve publicação nem validação em Android instalado/compartilhamento nativo. A tentativa de viewport de 390px não produziu essa largura efetiva no navegador; não considerar prova móvel de 390px.

A função atual `getScoreGrade` concede E a S. SS existe como acabamento visual aceito pelo componente; as regras de pontuação/concessão não foram modificadas.
