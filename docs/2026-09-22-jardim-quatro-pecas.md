# Jardim 3D — quatro peças de arte, 22/09/2026

Bancada: http://127.0.0.1:3020/zen3d-test/art-check.html (Vite principal).
Arraste para girar e use a roda para aproximar. Há três acabamentos e comparação dia/noite.

## Entrega local

| Peça | Tipo persistido | Triângulos | Lotes por material |
|---|---|---:|---:|
| Laje estratificada | strata-stone | 620 | 1 |
| Passarela de madeira | wood-walkway | 1.272 | 3 |
| Samambaia | fern | 2.156 | 2 |
| Luminária baixa | low-lantern | 580 | 3 |

São geometrias 3D geradas por `views/zen3d/GardenArt.ts`, não PNGs nem modelos de um serviço externo. A laje reutiliza mapas da rocha aprovada. Não há novas imagens, requisições remotas ou dependências. O código acompanha o JS do jardim.

Um conjunto gera 471.216 bytes de atributos de geometria antes de overhead do renderizador. Três temas em cache podem gerar três conjuntos; esse número não representa download nem RAM total. Instâncias repetidas do mesmo tipo/tema compartilham geometrias e materiais. Iluminação local mantém o teto existente de dois pontos, sem novos mapas de sombra.

As quatro peças entram nas três coleções existentes, com nomes e materiais por tema; não foi criado um sexto produto pago. A distribuição em um novo pacote comercial permanece uma decisão de catálogo. As peças têm miniatura pelo estúdio existente, silhueta de posicionamento, limites de ocupação e validação do documento. A passarela é transitável; as outras peças são obstáculos. Jardins existentes não recebem objetos automaticamente.

## Banco antes da publicação

Aplicar `supabase/migrations/20260922120000_garden_art_four_pieces.sql` antes de publicar o frontend que permite colocar as novas peças. A migração amplia a lista aceita pelo RPC mantendo autorização, inventário, revisões e URLs de areia. Não altera documentos salvos.

**Migração testada apenas em PostgreSQL local descartável, não aplicada em produção.** Sem ela, o servidor anterior rejeita jardins contendo os quatro novos tipos. Nenhum AAB, push ou publicação foi feito nesta etapa.

## Verificação

- Typecheck do jardim e build integrado: passaram.
- Build Vite do app principal: passou.
- `test:egress-estatico`: passou.
- `garden-art.regression.mjs`: três temas, geometria finita, limites e orçamento de triângulos/lotes.
- `zen3d.regression.mjs`: 411 checks iniciais e demais seções passaram, incluindo geometrias de posicionamento.
- `garden-terrain.regression.mjs`: passou, incluindo preservação de desenho e objetos antigos.
- `garden3d.sql.mjs`: salvar/reabrir os quatro novos tipos passou; tipo desconhecido rejeitado.
- Bancada inspecionada no navegador em três temas e dia/noite. Durante HMR houve aviso de createRoot duplicado; a bancada agora desmonta a raiz no descarte.
- Desempenho e interação em Android real, conta autenticada e banco de produção permanecem sem verificação.

O restante 2D do handoff não foi alterado.
