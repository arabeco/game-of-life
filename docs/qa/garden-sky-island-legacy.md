# Jardim: céu automático, ilha e placa atual

Implementação em 19/09/2026, incluída no AAB 1.0.97 (97). Ver `../releases/AAB-1.0.97-97.md`. Envio à Play a cargo do usuário.

- O horário local do aparelho controla sol, luar, estrelas, paleta e lanternas. Atualização a cada 15 segundos; ao voltar à aba, o relógio é atualizado. O ciclo é artístico, sem geolocalização ou cálculo astronômico sazonal.
- Céu em um único material, com cirrus finos e névoa estratificada. Não há arquivos de nuvens, serviço de clima ou novas texturas remotas.
- A ilha substitui o chão infinito e os cenários distantes. Sua rocha acompanha as dimensões e o formato; 1.280 triângulos adicionais, abaixo da areia. Câmera ajustada para mostrar a base.
- A placa usa `LegacyGrandPlaque`, com captura local e cor do perfil. A borda de captura usa uma linha sólida para evitar o preenchimento incorreto de `border-image` em SVG/foreignObject. A placa original mantém sua moldura metálica.
- No próprio jardim, a composição da placa usa relatórios da conta e limites das Eras, com as mesmas regras de ordenação, duplicação e ponderação do histórico. A imagem não é salva no documento do jardim nem enviada ao Storage. Em visitas, os totais privados não são consultados e aparecem como traços; nunca são preenchidos com o histórico do visitante.
- Os campos antigos `atmosphere`/`environment` são preservados por compatibilidade com o salvamento existente. O relógio e a imagem da placa são dados da sessão; não tornam o jardim sujo nem exigem salvar a cada atualização.

## Evidência local

- `npm run type-check:zen3d`: passou.
- Build integrado do jardim e build Vite principal: passaram, com avisos de chunks/importações já existentes.
- `tests/garden-world.regression.mjs`: relógio local, dia/noite, continuidade da luz, virada do dia, dimensões/orçamento da ilha, agrupamento/deduplicação dos relatórios.
- `tests/garden-terrain.regression.mjs`, `tests/garden-sand.hash.regression.mjs` e `tests/zen3d.regression.mjs`: passaram.
- Navegador, fixture de 390 × 844: ilha diurna, amanhecer, noite, estrelas, lua e placa ampliada conferidos visualmente. Correção da captura verificada após reproduzir a moldura cobrindo o conteúdo.
- Fixture de jardim antigo com desenho: mudar para círculo, salvar e reabrir manteve exatamente os hashes de objetos, cor e relevo e a escolha de terreno.
- Type-check geral ainda aponta erros fora dos arquivos desta mudança; não é uma aprovação global do repositório.

Não verificados: aparelho Android/WebView real, salvamento no Supabase de produção e leitura real das Eras de uma conta autenticada.

Prévia sem conta real: `/zen3d-test/world-check.html`, servida pelo Vite principal, após `npm run build:zen3d:embedded`. Os horários de teste só são aceitos na fixture local e não aparecem no produto.
