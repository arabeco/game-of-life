# Integração dos modais de arena e ação — 17/10/2026

Referência: proposta 01 de `drafts/arena-acao-cinco-propostas.html`, incluindo refinamentos de ação, agendamento e miniaturas carregados pelo HTML.

Os componentes ActionModal, NewArenaModal e ArenaDetailModal usam uma estrutura própria ReferencePlate. Foram removidas as classes que acionavam a estrutura antiga de GlassCard/action-dialog. Nome e ícone ficam no cabeçalho; abas, corpo rolável e rodapé seguem a composição da referência. ArenaCard compacto usa linhas separadas para título, indicadores, ações e progresso.

Preservados os callbacks de criação/edição, IDs de onboarding, agendamento, checklist, mídia e regras especiais de arenas de clã/compartilhadas.

Validação local:

- `npx tsc --noEmit`: passou.
- `node node_modules/vite/bin/vite.js build`: passou.
- Regressões cycle-scheduling, arena-progress-presentation, arena-compartilhada e arena-da-jornada: passaram.
- `git diff --check`: passou.
- Navegador: criação de arena, edição de arena e criação de ação com duração, repetições, contexto e agendamento; conferência dos argumentos enviados aos callbacks. Checklist e composição em larguras móveis também conferidos.
- Prévia final recomposta com o CSS do build em `output/modal-integration/preview.html`; gerador: `tools/preview-integrated-modals.mjs`. Capturas em `output/modal-integration/nova-acao.jpg` e `arena.jpg`.

A prévia monta os componentes reais com GameContext, Supabase e seletores auxiliares simulados. Esta validação não comprova gravação no Supabase nem execução Android. Nenhum AAB foi gerado nesta correção.

## Próxima revisão visual — Campanhas e loja (18/10)

Pedido de Afonso: juntar estes pontos às propostas dos modais de arena e ação, usando a referência acima como ponto de partida. Pendência de revisão/proposta; não implementada nesta anotação.

- Aba Campanhas: rever a composição e reduzir o arredondamento excessivo, que foi rejeitado por Afonso. Avaliar cartões, contêineres e hierarquia visual em conjunto com os modais de arena e ação.
- Miniaturas de campanhas na loja: revisar formato, enquadramento da imagem, legibilidade e proporções, mantendo coerência com Campanhas e com a direção visual dos modais.
- Conferir as telas atuais e preparar a comparação visual antes de definir os detalhes da alteração. Não tratar a implementação anterior dos modais como uma nova pendência funcional.


## Implementação local da revisão — 18/10

- Minhas Campanhas e o detalhe usam ReferencePlate no lugar do GlassCard antigo. Abas com linha de seleção, controles com cantos discretos e painéis internos em grafite.
- Cartões da biblioteca e da loja compartilham material de placa; títulos em tamanho de leitura e arenas em linhas com ícone colorido, nome e quantidade de ações. Loja usa uma coluna no celular e duas a partir de 640 px.
- Compra, instalação, filtros, histórico e callbacks preservados. Arrays vazios de preview estabilizados para evitar atualização contínua no useEffect quando o modal abre sem preview.
- Prévia dos componentes reais: output/campaign-style/preview.html; gerador tools/preview-campaign-style.mjs. Dados, carteira e callbacks simulados, sem compra real.
- TypeScript e build web passaram; conferidos em navegador o detalhe, a Biblioteca e a confirmação de compra, incluindo largura de 390 px. Sem publicação ou AAB. Avaliação visual final de Afonso pendente.

### Correção após revisão visual de Afonso
Campanha na ArenasView deve ocupar UMA célula, economizando espaço ao agrupar. A proposta anterior de duas colunas foi rejeitada. Agora contém duas placas pequenas com os títulos das arenas e contador total; a lista detalhada permanece para loja/biblioteca. Títulos dos ArenaCard passaram de 7 para 11 px e os cartões para 96 px de altura. A prévia agora monta ArenasView inteira, com contexto/dados simulados, em vez de copiar seu JSX. Navegador conferido em largura efetiva de 391 px e abertura do detalhe. TypeScript/build passaram. Visual ainda sujeito à aprovação do usuário; não comprova APK instalado.

### Integração final solicitada em 18/10
Afonso pediu incorporar a revisão ao app: campanha em uma célula, duas placas internas com emoji, títulos maiores e centralizados, emoji ao lado. Alterações estão nos componentes reais, não apenas na prévia. getCampaignGradient combina os tons das arenas em ArenasView, cartões da biblioteca/loja e detalhe. Usa a sequência de tons existente, sem SQL novo. Testes de cores e ciclo de campanha e TypeScript passaram; build completo com jardim recompilado. Conferência visual local com dados simulados; não houve instalação no Android ou publicação.


### Estado final confirmado — 18/10

- Títulos finais de arena e campanha: 13 px; emoji ao lado, conjunto centralizado. A passagem intermediária para 11 px descrita acima foi superada.
- Campanha ocupa uma célula de 96 px de altura, como as arenas. Duas placas internas mostram emoji e nome; contador informa o total de arenas.
- Gradiente combina todos os tons distintos das arenas contidas; aplicado na grade, biblioteca, loja e detalhe, sem migration adicional.
- Integração nos componentes reais e build completo (`npm run build`, incluindo jardim embarcado) concluídos. TypeScript, regressões de ciclo de campanha e gradientes passaram. Visual conferido no navegador e abertura do detalhe testada com dados simulados.
- Não foi gerado AAB, instalado no Android, publicado ou feito push nesta rodada.
