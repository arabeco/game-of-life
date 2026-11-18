# Entrega — descoberta social e visitas ao jardim

Implementação local em 17/11/2026, seguindo `2026-11-15-descoberta-social-e-visitas-ao-jardim.md`.

**Atualização para o Claude:** esta entrega também inclui o pedido posterior de prévia aérea giratória e entrada suave no jardim. Conferir o complemento ao final antes de fechar o release. As mudanças da câmera são locais, não exigem SQL adicional e ainda precisam de validação visual/toque no Android.

Não houve commit, push, publicação, execução de SQL remoto, deploy de Edge Function, alteração de versão ou geração de AAB. As alterações locais preexistentes do Oráculo, Planner, perfil e catálogo foram preservadas.

## O que foi implementado

- Social: Pessoas para conhecer, até cinco cartões, motivo, patente, avatar, Adicionar, Ver perfil e atualização por botão ou gesto de puxar. Pessoas já vinculadas ou com pedidos pendentes são excluídas.
- Privacidade: os dois ajustes novos ficam no painel de privacidade. Recomendações respeitam adesão, atividade recente, amizades, recusas por 30 dias e visibilidade das arenas.
- Reino: montagem pura depois de `filtrarFeed`, três destaques no máximo, dois posts por pessoa/dia incluindo destaques, deduplicação, afinidade antes da data e botão de amizade. Aliados conserva sua montagem anterior.
- Visitas: recado de frase pronta, peixes e borboleta, com preços vindos do servidor. Seletor sobre o jardim, confirmação em dois toques por dois segundos, PNG de fragmento, motivos de indisponibilidade e saldo atualizado.
- Banco: débito e marca na mesma transação, chave de repetição segura, limite diário com virada às 04h de São Paulo, recado único por dia, acesso condicionado à visibilidade e à preferência do dono, máximo de 20 marcas visuais e remoção pelo dono.
- Dono: painel de visitas não vistas, histórico paginado, remoção de recados e um alerta do sistema por visitante/dia, atualizado com as interações.
- 3D: camada independente de pedras, borboletas e peixes temporários. Não entra no snapshot salvo. Modo Essencial suspende animação decorativa e o seletor não desliza. Cliques fora, inclusive dentro do iframe, fecham o seletor.

## Arquivos criados e alterados nesta entrega

- `components/PessoasParaConhecer.tsx`: cartões, botão compartilhado de amizade e ajustes de privacidade.
- `components/GardenVisitPanel.tsx`: seletor, frases, confirmação, recibo, histórico e remoção.
- `components/Garden3DModal.tsx`: integração do painel e mensagens da camada de visitas; compra de item também exige jardim próprio.
- `contexts/GameContext.tsx`: presença social autenticada e atualização do saldo por releitura do servidor.
- `views/MundoView.tsx`: bloco recomendado acima dos aliados.
- `views/SettingsView.tsx`: preferências sociais no painel de privacidade.
- `views/HallOfFameView.tsx`: montagem do Reino e afinidade fornecida pelo servidor.
- `utils/descobertaReino.ts`: limite diário, destaques e deduplicação em função pura.
- `utils/visitasJardim.ts`: dez frases, tipos, motivos e regra de confirmação.
- `views/zen3d/GardenControls.tsx`: órbita da prévia, enquadramento, pausa ao interagir, arrasto e transição para o passeio.
- `views/zen3d/cameraMotion.ts`: regras puras de câmera, amortecimento e bloqueio de desenho fora do editor.
- `views/zen3d/gardenAccount.tsx`: dados transitórios da visita no contexto do jardim.
- `views/zen3d/SandExperiment.tsx`: inclusão da camada 3D de visitas.
- `zen3d-test/AccountGarden.tsx`: recepção das marcas, inspeção de autoria e aviso de clique no iframe.
- `zen3d-test/GardenVisitMarks.tsx`: objetos leves das três interações iniciais.
- `supabase/migrations/20261117120000_pessoas_para_conhecer.sql`: preferências, presença, candidatos e pontuação compartilhada.
- `supabase/migrations/20261117130000_visitas_jardim.sql`: catálogo, marcas, cobrança, histórico e alertas.
- `tests/descoberta-reino.regression.mjs`: destaques, limite, ordem, unicidade e entrada preservada.
- `tests/pessoas-para-conhecer.regression.mjs`: execução local em PostgreSQL/WASM das regras de recomendação.
- `tests/seletor-visitas.regression.mjs`: motivos de bloqueio e janela de confirmação.
- `tests/visitas-jardim.regression.mjs`: execução local em PostgreSQL/WASM das regras de cobrança, acesso, histórico e limites.
- `tests/garden-entrada-suave.regression.mjs`: regressão adicional da entrada, prévia e amortecimento da câmera.
- `tools/descoberta-social-bancada.html`: entrada da bancada local.
- `tools/descoberta-social-bancada.tsx`: componentes reais com RPCs fictícias, sem transações de produção.
- `output/descoberta-baseline-tests.json`: resultado inicial de todos os testes de regressão então presentes.
- `output/descoberta-final-tests.json`: resultado final de todos os testes de regressão.
- `docs/2026-11-17-descoberta-social-aplicar.sql`: bloco SQL completo, concatenado na ordem de aplicação manual.
- `docs/2026-11-17-entrega-descoberta-social-e-jardim.md`: este relatório.

## SQL e publicação

Aplicar manualmente, nesta ordem:

1. `supabase/migrations/20261117120000_pessoas_para_conhecer.sql` — `sql:checa` passou.
2. `supabase/migrations/20261117130000_visitas_jardim.sql` — `sql:checa` passou.

O bloco completo está em `docs/2026-11-17-descoberta-social-aplicar.sql`. Não foi executado contra o Supabase. Depende das migrações existentes de jardim, expansões, feed, curtidas e amizades. O checador valida compilação em andaime local; não certifica o esquema remoto.

Nenhuma Edge Function foi alterada por esta entrega. As RPCs são instaladas pelas migrações. Há alterações preexistentes em `supabase/functions/oraculo-ia/index.ts`, que pertencem a outro trabalho e devem ser tratadas separadamente pelo Claude.

Mudanças de app exigem distribuição de uma nova versão/AAB para chegar ao Android instalado. O build web também contém as mudanças se o cliente web for publicado. A home comercial glyph.life, Premium, textos públicos e versões não foram alterados. O build regenerou os arquivos ignorados de `public/garden3d`, `public/garden-experiment` e `dist`.

## Validação

- `npm run type-check`: passou.
- `npm run type-check:zen3d`: passou.
- `npm run build`: passou; o Vite manteve o aviso de chunks maiores que 500 kB.
- `git diff --check`: passou, apenas avisos de normalização de fim de linha.
- Todos os `tests/*.regression.mjs`: **184 arquivos executados, 182 passaram, 2 falharam**.
- Os quatro testes novos passaram. Os testes SQL exercitam as funções reais em PGlite, não apenas buscas de texto.
- Testados: rollback se a gravação do alerta falhar após o débito; saldo insuficiente; requisito de lago; quarto gesto e segundo recado; virada do dia; remoção sem liberar cota; opt-out e jardim invisível; frase inválida; repetição com a mesma chave; saldo do dono preservado; bloqueio do helper de cobrança para `authenticated`; bloqueio de inserção direta; 20 marcas; histórico e leitura persistida; compra de expansão com o helper compartilhado.
- Navegador local com dados fictícios e largura de conteúdo de 390 px: seletor, confirmação, saldo 10→7→6, lista das dez frases, recado indisponível após uso, modo Essencial, cartões recomendados e exclusão após pedido. A paisagem 3D renderizou; não foi feita aprovação visual detalhada de cada animação.

Falhas preexistentes, presentes no resultado inicial e no final:

- `a-mao-ganha-do-oraculo.regression.mjs`: expectativa textual de que `emitOracleSpeech` guarde a fala durante um gesto.
- `feitos-cards.regression.mjs`: expectativa textual de `grade` até 300 caracteres depois de `type: 'CYCLE_COMPLETED'`.

Não foram corrigidas por serem de trabalho anterior e fora desta entrega. Os logs completos estão nos JSONs de resultado.

## Decisões de implementação

- A migração indicada no guia bloqueava a escrita do saldo, mas não oferecia um helper de débito. Com autorização do Afonso para resolver da melhor forma, o padrão transacional de `buy_garden_expansion` foi extraído para `_debitar_fragmentos`. Visitas e expansões usam o helper, que não pode ser executado pelo cliente. Os preços e recibos de expansão foram preservados.
- Catálogo e preços ficam numa constante SQL; a UI recebe esse catálogo. A bancada tem dados fictícios próprios, sem autoridade sobre preços reais.
- Perfil público inicial significa `feats_visibility='all'`, o controle existente para arenas/feitos. Não existe um booleano geral de perfil público no modelo atual. Uma escolha explícita no novo ajuste prevalece.
- Presença recebe registro autenticado no app, limitado a uma gravação por 15 minutos. Não foram inferidos acessos a partir de alterações genéricas do perfil. **A lista começa a ser povoada conforme pessoas abrem o cliente atualizado**; não há preenchimento retroativo.
- Empates de recomendação são aleatórios para permitir renovação; o sinal de maior pontuação continua determinando o motivo. Amigo em comum usa frase genérica, sem expor a lista de relações.
- O Reino usa a mesma virada às 04h de São Paulo das visitas. O limite abrange tanto destaques quanto posts normais.
- A pontuação do Reino é consultada para até 200 autores carregados; autores além disso conservam prioridade zero. O ranking e os destaques operam sobre o feed já carregado, conforme o guia, e não representam busca global por todo o banco.
- Uma chave UUID identifica a tentativa de interação e é reutilizada em falha de rede. O cliente não anuncia gasto bem-sucedido antes do recibo.
- Histórico preservado na tabela, exibido em páginas de 50. Visitas não vistas são entregues em lotes de até 100; fechar confirma apenas os IDs apresentados.
- Alertas reutilizam o tipo existente `system` e a superfície atual de Alertas; não foi criado um novo canal.
- Pétalas e lanterna estão no catálogo como inativas, conforme a fase inicial permitida pelo guia.

## Pendências para o fechamento com Claude/Afonso

- Conferir/aplicar as duas migrações no projeto correto e validar com duas contas reais autorizadas: recomendações, privacidade, visita, saldo, alerta e painel do dono.
- Validar concorrência real entre sessões/dispositivos. Os locks e a idempotência foram implementados; o teste local não simula corrida entre conexões independentes.
- Validar toque e desempenho no Android, incluindo foco acessível, safe areas, fechamento ao tocar no iframe e duração visual das marcas.
- Aprovar visualmente borboleta, pedra e reunião dos peixes no jardim real e em diferentes tamanhos de terreno; a bancada não substitui essa revisão.
- A preservação da chave de repetição cobre tentativas no painel aberto; após fechar/reabrir ou reiniciar o app, uma nova intenção recebe outra chave. Os limites diários continuam protegidos no servidor.
- Resolver as duas falhas preexistentes se forem bloqueadoras do processo de release.
- Claude fecha commit, push, publicação e AAB quando combinado com o Afonso.


## Complemento — prévia aérea e entrada suave

Pedido posterior do Afonso em 17/11/2026: mostrar o jardim por fora com a câmera girando e melhorar entrada/arrasto.

Comportamento esperado para conferir:

1. Ao abrir, o jardim aparece de fora, com uma volta aérea lenta e enquadramento que acompanha a rotação.
2. Tocar/arrastar pausa a volta automática; o arrasto horizontal gira a prévia. A órbita pode retomar após seis segundos sem interação.
3. Na visita, **Entrar** amplia a janela e comunica ao iframe a mudança para passeio, aproximando a câmera do ponto de entrada. Antes, apenas ampliava a janela.
4. Dentro do jardim, arrastar olha em volta com amortecimento; o joystick move a pessoa. **Voltar** retorna à prévia.
5. A regra de desenho na areia só captura o gesto no modo de edição; não bloqueia mais o arrasto sobre a ilha na prévia.
6. Conferir também modo Essencial, preferência de movimento reduzido do sistema e jardins expandidos. O jardim próprio continua com Entrar e Editar separados.

- `views/zen3d/GardenControls.tsx`: órbita aérea lenta, pausa de seis segundos após interação, enquadramento ajustado à rotação, arrasto horizontal para girar a prévia, movimento amortecido e aproximação ao ponto de entrada. Respeita preferência do sistema por movimento reduzido; órbita desativada no Essencial.
- `views/zen3d/cameraMotion.ts`: funções puras de amortecimento, permissão de desenho e modo de visita.
- `components/Garden3DModal.tsx`, `zen3d-test/AccountGarden.tsx` e `views/zen3d/gardenAccount.tsx`: Entrar/Voltar sincronizam o modo de câmera com o iframe. Antes, Entrar só ampliava a janela.
- `views/zen3d/SandExperiment.tsx`: visita alterna entre prévia e passeio; regra de desenho deixa de bloquear arrasto sobre a ilha fora do editor.
- `tools/descoberta-social-bancada.tsx`: botões Entrar/Voltar para exercitar a câmera sem conta real.
- `tests/garden-entrada-suave.regression.mjs`: novo teste, escrito antes da implementação; passou.

Validação adicional: type-check do app e do 3D passaram; regressões `zen3d` (411 checks e verificações de geometria/caminhada), `garden-editor-mode` e `garden-entrada-suave` passaram. Build do jardim embutido passou. Sem novas migrações. A suíte completa de 184 arquivos acima se refere à entrega anterior; não foi repetida integralmente para este complemento. Verificação visual desta nova transição pendente: navegador local indisponível neste chat. Testar no Android antes de publicar.
