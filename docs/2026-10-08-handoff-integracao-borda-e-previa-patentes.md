# Borda Soberano e bancada de patentes — 2026-10-08

## Aplicado

- `constants/items.ts`: item `item_border_4_002` aponta para `/assets/catalog/interface/borda_soberano.png`.
- PNG transparente copiado da entrega para `public/assets/catalog/interface/`. O ID e as regras de recompensa existentes foram preservados.
- `NobilityLadder` aceita `unfilteredBackgrounds` (padrão `false`). A bancada ativa essa opção para mostrar a arte sem gradientes escuros nem filtro de patente bloqueada. O app mantém seu padrão atual.
- Bancada em `tools/patentes-editor.html`, com configuração `vite.patentes.config.ts`. Executar `node node_modules/vite/bin/vite.js --config vite.patentes.config.ts` e abrir `http://127.0.0.1:3016/patentes-editor.html`.
- Prévia começa sem máscara, com opção de comparação. Usa o componente real da escada e dados fictícios. As outras proporções são simulações, não telas reais de Perfil/Mundo. A borda na bancada usa avatar ilustrativo.
- Os onze arquivos de entrega estão incluídos para a bancada funcionar em outro checkout.

## Pendências e limites

- Os dez fundos de patente ainda NÃO estão integrados ao catálogo de fundos do app.
- Recorte central corta alguns objetos nas faixas estreitas. Teste com posição vertical de 43% melhorou a escada, mas não foi aplicado como ajuste definitivo. Avaliar cada patente e superfície.
- Ajustes da bancada ficam no localStorage `glyph-patentes-crops-v1`, com exportação/importação JSON; não alteram a conta nem o app.
- Os sete fundos de clã já têm arquivos e referências em `constants/GMboard.ts`. Enquadramentos nas telas reais ainda precisam de avaliação visual.
- A retirada da máscara foi aplicada à prévia. A integração visual definitiva dos fundos continua pendente.
- Há outras alterações locais de onboarding, ciclos e avatar fora deste commit; não pertencem a esta entrega.

## Verificação

- `npx tsc --noEmit`: passou após integração.
- Servidor local retornou HTTP 200 e `image/png` para a borda no caminho final.
- SHA-256 do PNG instalado coincide com a entrega original.
- Sem publicação, push ou validação Android neste trabalho.
