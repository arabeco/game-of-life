# Jardim 3D: salvamento, inventário e aquisição

## Aplicar no Supabase

Execute o arquivo inteiro `supabase/migrations/20260909180000_garden3d_inventory_and_saves.sql` no SQL Editor do projeto do Glyph, depois das migrações existentes de catálogo, inventário e ouro. O arquivo usa uma transação, pode ser reaplicado e não altera `gardenState` do jardim 2D.

Ele cria:

- Cinco registros no catálogo `items`, categoria `garden`, tier 5 / lendários.
- `user_gardens_3d`: composição e areia, separadas dos dados antigos, com leitura somente pelo dono.
- `save_garden_3d`: valida a posse de kits, modelos e artes e exige a revisão atual para evitar sobrescritas entre sessões.
- `buy_garden_item`: cobra o preço do servidor usando o ledger de ouro existente e concede o item no inventário. Repetir a compra de um item já possuído não cobra novamente.

Não execute um seed completo de catálogo para esta entrega. A migração altera apenas os cinco novos IDs e as estruturas do jardim. Não foi aplicada ao Supabase por este trabalho.

## Catálogo proposto

| Item | ID | Ouro |
| --- | --- | ---: |
| Kit Pátio dourado | `garden_kit_luxury` | 420 |
| Kit Gênesis | `garden_kit_genesis` | 500 |
| Base Espelho do bosque | `garden_base_pond` | 340 |
| Base Margens do refúgio | `garden_base_river` | 500 |
| Base Caminho antigo | `garden_base_path` | 380 |

Preços provisórios, escolhidos na faixa dos lendários atuais. O kit Refúgio natural e a base Pátio do silêncio são gratuitos e não ocupam o conjunto de itens sorteáveis.

O Gênesis é **lendário temático**, disponível nos baús normais que podem sortear tier 5. Não foi transformado em recompensa exclusiva da temporada: o baú de temporada atual trabalha com tier 6 / mítico. A função existente de baús inclui os cinco novos itens por raridade, sem substituir as chances ou recompensas atuais.

Cada kit desbloqueia uma coleção de peças com formas e acabamentos próprios, sem trocar a composição inteira. Quantidades colocadas no jardim continuam limitadas por capacidade, não por consumo de cópias do kit. As bases desbloqueiam os formatos e composições correspondentes.

## Como funciona no app

1. O Jardim carrega o registro 3D e os IDs do inventário autenticado.
2. A aba Itens mostra os artefatos/insígnias possuídos e as coleções desbloqueadas. Objetos básicos ficam disponíveis para todos.
3. A Loja do jardim mostra bloqueios e preços. A compra pede confirmação, usa a compra do app e atualiza o inventário; os mesmos itens aparecem na loja geral e no Arsenal, na categoria Jardim.
4. **Salvar** envia a composição atual e as duas texturas PNG da areia. Arrastar, girar e desenhar não fazem gravações de rede. Salvamentos consecutivos idênticos são descartados pelo shell.
5. A indicação “salvo” só aparece após a resposta do servidor. Falhas mantêm a edição na tela. A saída pede confirmação quando existem alterações pendentes.

O teste de desenho gerou aproximadamente 656 KB por salvamento. A resolução da areia é fixa em 512 × 1024, os limites são 64 objetos e 8 artefatos; o servidor limita o documento e confere as dimensões PNG. Os objetos são gravados por tipo, posição, rotação, variante e kit. Modelos e imagens 3D não são enviados para Storage.

Os artefatos e insígnias exibidos usam as imagens originais do catálogo do app. Uma arte reciclada/removida do inventário deixa de ser utilizável na próxima abertura. Os kits/bases dependem da posse registrada no servidor mesmo que o cliente seja modificado.

## Verificação feita

- Build completo do app e TypeScript do jardim passaram.
- Regressões existentes de geometria, bases, ponte, espaço pessoal e desempenho passaram.
- PostgreSQL descartável (PGlite): migração reaplicada, salvar/reabrir, revisão obsoleta, rejeição de itens não possuídos, isolamento entre usuários, compra sem saldo, repetição sem nova cobrança e sorteio pela função **real existente** do baú lendário passaram.
- Navegador: inventário com uma arte, bloqueios de kits/bases, colocação e giro de pedra, salvamento explícito, reabertura com texturas idênticas, falha simulada e nova tentativa passaram.
- O TypeScript global ainda aponta diagnósticos em outras partes do projeto; não está sendo declarado limpo.

O banco descartável usa uma estrutura mínima das tabelas existentes e um ledger de teste. Isso não substitui validar a migração no esquema real, fazer login no app e confirmar a compra/baú em uma conta de teste. Não foi publicado nem gerado AAB nesta entrega.

## Testes reproduzíveis

`npm run type-check:zen3d`, `node tests/zen3d.regression.mjs`, `npm run build`.

`tests/garden3d.sql.mjs` recebe como argumento o caminho de `@electric-sql/pglite/dist/index.js`; não toca no banco remoto. `tests/garden3d.account.browser.mjs` recebe o caminho de `playwright/index.mjs`, usa Edge headless e requer o dev server do protótipo na porta 3018. Essas dependências de teste foram instaladas em diretório temporário, fora do projeto.

`/zen3d-test/account-check.html` é uma bancada de desenvolvimento com conta fictícia e salvamento em memória para testar a ponte com o iframe. **Não é o app autenticado e não entra no build de produção.** O protótipo aberto diretamente continua livre para experimentar todos os kits; a versão embarcada usa o inventário real.

## Limites restantes

- Visitas ao jardim de outros jogadores seguem indisponíveis. Nenhuma política pública de dados foi aberta.
- A face da placa de Legado ainda é a imagem demonstrativa anterior; a captura do Legado real é uma próxima integração.
- O SQL precisa ser aplicado e o fluxo autenticado precisa ser validado no Supabase real antes de liberar a atualização aos jogadores.


## Revisão: coleções e retirada do catálogo 2D

Foram encontrados nove itens antigos: `item_garden_stone_1`, `item_garden_stone_2`, `item_garden_stone_3`, `item_garden_plant_1`, `item_garden_plant_2`, `item_garden_tool_1`, `item_garden_lantern_1`, `item_garden_bridge_1` e `item_garden_statue_1`.

No código, estão aposentados e ocultos do catálogo; o carregamento de artefatos do Jardim 3D também os exclui. O gerador de SQL respeita a aposentadoria para não reativá-los em um futuro seed. A migração `20260909180000_garden3d_inventory_and_saves.sql` foi revisada para marcar esses nove registros como aposentados, fora de circulação e sem preço. Não apaga a posse histórica nem os desenhos 2D. O servidor também rejeita seu uso como artefatos 3D.

**O SQL não foi aplicado ao Supabase remoto.** A retirada no banco só acontece após sua execução. O teste em PostgreSQL descartável confirmou a retirada, a preservação da posse e a rejeição de uso no novo jardim.

Cinco mudanças concretas nesta revisão:

1. Caminhos aparecem junto de Pedras.
2. Luzes e esculturas ficam em Ornamentos.
3. O filtro Todas as coleções permite combinar peças dos kits; não há botão para recolorir a peça selecionada.
4. Os kits têm peças próprias: pedras lapidadas, taça de flores e candelabro no Luxo; geodos, jardineira lunar e farol de cristal no Gênesis. A vitrine lista as peças efetivamente disponíveis.
5. Três esculturas experimentais: Totem das três pedras, Guardião do pátio e Relicário de ametista. Permanecem apenas na rota de teste, fora do inventário autenticado e do salvamento de produção, até aprovação visual.

O teste de navegador verifica as três esculturas colocadas simultaneamente, giro e filtros. O teste da conta continua cobrindo inventário, salvamento e reabertura. A qualidade visual e o desempenho em celular físico ainda precisam de avaliação no aparelho.
