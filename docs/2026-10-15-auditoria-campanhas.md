# Campanhas — auditoria de fluxo e interface

15/10/2026. Inspeção do código local e execução das funções de contagem com dados sintéticos. Sem alteração nas regras do app, SQL remoto, compras, publicação ou novo AAB. A prévia HTML foi ajustada separadamente.

## Respostas às dúvidas

### Catálogo: arenas, ações e dias

`components/Store/CodexStore.tsx:495` lista até três arenas e um número de ações em cada linha; acima disso mostra “+ N arenas”. O rodapé mostra `duration_days` e `preview.actions.length` rotulado como “ações por dia” (:523). Esse valor conta modelos de ação diferentes, não frequência diária. O detalhe em `components/CampaignsCodex.tsx:1001` já mostra totais de arenas, ações e fases.

Proposta: no cartão, “2 arenas · 5 ações” e duração estimada quando disponível. Repetições e agenda no detalhe, sem inferir “por dia” pela quantidade de modelos. Não acrescentar mais caixas explicativas ao cartão.

### Campanha com mais de um ativo

`views/ArenasView.tsx:2663`: no modo por ativos, campanhas ficam na seção própria “Campanhas Ativas”. `assetGroups` (:353) usa todas as arenas, então as arenas integrantes também aparecem em seus respectivos ativos. No modo livre, `rootArenas` (:315) exclui integrantes de campanhas da lista de arenas avulsas.

Manter a campanha inteira na seção própria parece adequado. Identificar os ativos envolvidos com pequenos marcadores e indicar discretamente a campanha de origem nas arenas mostradas por ativo. Não duplicar a campanha inteira em cada área.

Há uma limitação diferente no conteúdo importado: `utils/codexPreview.ts` e `contexts/GameContext.tsx:7891` atribuem um único ativo principal a todas as arenas de um template de catálogo. `buildCodexTemplateFromDraft` (:175) não serializa o ativo por arena ao enviar um rascunho. Campanhas manuais podem reunir áreas distintas; essa diversidade não está preservada de ponta a ponta no formato de template inspecionado.

### Campanha que ultrapassa o ciclo

`utils/cycleCommitment.ts` cobra todas as repetições das ações pessoais não livres em arenas ativas. Campanhas comuns não recebem a exclusão das missões (`sourceQuestId` / domínio de missão). `endCycle`, em `contexts/GameContext.tsx:9911`, usa esse resultado.

Reprodução com a função real: meta 20, cinco conclusões no período = 5/20, 25%. Com `sourceQuestId`, as cinco conclusões ficam como missões e não adicionam compromisso obrigatório. O número de dias anunciado no catálogo não limita nem adapta o compromisso na instalação.

Proposta para campanhas de conteúdo com duração própria: progresso acumulado independente do ciclo; o realizado contribui para o ciclo, e a parte futura não vira falta. Não conceder automaticamente bônus de missão a campanhas. Uma campanha manual que apenas agrupa arenas pessoais precisa de regra explícita: agrupar não deveria retirar silenciosamente os compromissos já assumidos.

## Problemas confirmados e riscos por etapa

| Etapa | Evidência | Impacto / encaminhamento |
|---|---|---|
| Descoberta e aquisição | Loja compra e tenta instalar em seguida (`CodexStore:147`); instalação verifica capacidade e mantém item adquirido se faltar espaço. | Distinguir adquirido, instalado e capacidade necessária antes de iniciar. |
| Prévia e instalação | Ícone da arena no preview vem de sugestão pelo título; instalação usa ícone da primeira ação. | Mesma campanha pode mudar de aparência ao entrar. Compartilhar transformação entre preview e instalação. |
| Conteúdo multiativo | Template e instalador usam um ativo principal para todas as arenas. | Preservar `assetId` por arena, com fallback para templates antigos. |
| Instalação de catálogo | Cria arenas, ações, dependências e campanha sequencial, com tentativa de rollback (`GameContext:7891–8070`). | Boa base; validar resultado e recuperação de falhas parciais. Rollback por múltiplas chamadas não é uma transação. |
| Instalação de rascunho próprio | `CodexModal:500` cria arenas e ações, mas não cria o agrupamento `Campaign`; o caminho não tem rollback equivalente. | Pode anunciar campanha instalada e deixar arenas soltas; unificar instaladores. |
| Agenda | `taskDomain:742` gera datas até o horizonte do ciclo, sem limitar pelo saldo de repetições ou consultar dependências da campanha. Instalador chama isso para cada nível com agenda. | Pode agendar fases futuras antes de desbloqueá-las. Planejar por fase disponível e saldo. |
| Virada do ciclo | `CampaignsCodex:319` e `ArenasView:1201` filtram tarefas pelo ciclo; `progressUtilsEngine:136` deriva desbloqueios dessas conclusões. | Progresso pode diminuir e fase liberada voltar a bloquear. Acumular progresso da campanha fora do recorte do ciclo. |
| Contagem por ação | `progressUtilsEngine:73` soma conclusões sem limitar cada ação à sua meta. | Quatro conclusões da ação A (meta 2), zero da B (meta 2): arena aparece 100% e liberada. Limitar contribuição de cada ação, preservando extras separadamente. |
| Continuidade | `startNewCycle` regenera recorrências; não resolve a persistência do avanço por fase. | Corrigir continuidade e agenda juntas, não somente a porcentagem exibida. |
| Organização | Campanhas têm seção própria por ativo; arenas também aparecem em suas áreas. | Tornar a relação visual clara e manter identidade de cada ativo. |
| Edição | Editor contém fases, anexação, reordenação, dependências e remoção de arena. | Deixar execução simples e ferramentas estruturais concentradas no modo de edição. |
| Remoção | Remover arena da campanha preserva arena; excluir campanha apaga integrantes. Há confirmação explícita. | Preservar distinção. A exclusão atual é sequencial, com risco de estado parcial em erro; revisar recuperação. |

## Ordem sugerida

1. Definir compromisso de campanha versus ciclo e progresso acumulado entre ciclos.
2. Corrigir contribuição por ação e desbloqueio; impedir agenda de fase indisponível.
3. Unificar instalação/preview/rascunho e preservar ativos por arena.
4. Ajustar contagens do catálogo e organização visual, reutilizando a identidade existente.

## Evidência local

`output/campaign-pipeline-audit.json` contém a execução das funções reais para: ciclo curto 5/20, missão equivalente fora do denominador, fase que volta a bloquear ao trocar o período, e excesso de uma ação cobrindo outra pendente. Isso comprova a lógica local, não uma sessão real em produção.

## Miniaturas e AAB 111

Conferido `android/app/build/outputs/bundle/release/Glyph-1.0.111-111.aab`, SHA-256 `0d2288fb17c42f0a1bb3b8a8cc04d209370b96403ab8b2e4623767ce4dd406a2`, igual ao checkpoint.

O bundle `base/assets/public/assets/ArenaDetailModal-Dtxn2LM8.js` contém o ArenaCard compacto: quatro camadas de gradiente preto/prateado com detalhes do ativo, filtro de vidro e `PlasmaCanvas` na cor do ativo, opacidade 0,35. A animação depende das preferências de animação/redução de movimento e da opção de desativar animações do quadro. Os shaders atuais foram encontrados idênticos dentro desse AAB; a prévia v19 usa esses shaders, os mesmos pontos de gradiente e a mesma opacidade. A v17 tinha substituído o fundo pelo gradiente das ações; v18 ainda não incluía o plasma. Ambos perderam a composição original.

As tags foram restauradas a SVGs de `Icons.tsx` e às cores de `ArenaStatusTags`: parceria azul, competição rosa, mentoria verde, pacto âmbar e temporada violeta. Continuam no espaço reservado da prévia; o app não foi editado. O layout da prévia é demonstrativo, não uma execução do AAB no Android.

Também conferido `base/assets/public/index.html`: a camada externa de plasma usa `opacity: 0.35`, `mix-blend-mode: screen` e blur de 0,4 px, além da opacidade do shader. Essa composição global foi incorporada à prévia. Em ArenasView o plasma é desativado no modo cartões com mais de 10 arenas, além das preferências de animação.


## Implementação aprovada — 15/10

- Loja guarda a aquisição na biblioteca; o quiz só instala se a campanha já era possuída antes da ação. Recebimento de mentoria deixa de instalar automaticamente.
- Central de campanhas com abas Em andamento, Biblioteca e Histórico. Corrigido o retorno antecipado que impedia abrir uma campanha guardada. Cartões sem altura proporcional que cortava conteúdo em celular.
- Instalação explícita com proteção contra clique repetido e contra instalação já ativa. Novo uso gera IDs de arenas e ações independentes. Rascunho autoral usa o mesmo instalador e cria o agrupamento da campanha.
- Template preserva ativo, ícone, configuração de fases e pré-requisitos de cada arena, inclusive campanhas paralelas. Templates antigos mantêm fallback sequencial.
- Campanhas instaladas têm progresso acumulado, inclusive tarefas anteriores à janela usual de três meses (leitura paginada). Não viram dívida na nota do ciclo e não ganham bônus de missão por essa exclusão. Conclusões continuam no volume/atividade do período mesmo depois de arquivar.
- Agrupamentos manuais de arenas pessoais continuam seguindo os compromissos pessoais do ciclo. A proteção de conteúdo independente se aplica às ações instaladas, identificadas pela origem.
- Contribuição de cada ação limitada à sua meta no progresso. Etapas bloqueadas ficam indisponíveis para agendamento e conclusão. Recorrências de conteúdo são geradas por etapa disponível, dentro do horizonte do ciclo e com o saldo de repetições.
- Campanha mostra a próxima arena disponível e o botão Abrir; depois dos pré-requisitos, mostra Arena liberada. Mantida a celebração existente, sem outro toast de desbloqueio.
- Concluir e guardar / Arquivar chamam a função transacional finish_campaign_run. Histórico e tarefas concluídas são preservados; pendências futuras saem do planner; a biblioteca permite instalar novamente. Arquivadas deixam de consumir capacidade de arenas.
- Afonso confirmou ter executado `20261015120000_campaign_library_runs.sql` nesta conversa. Nenhuma alteração posterior foi feita nesse SQL. Não houve RPC autenticado real para comprovar o fluxo remoto nesta rodada.

Validação: TypeScript; build Vite; regressões campaign-lifecycle, denominador-do-ciclo e cycle-scheduling; navegador em 390×844 com CampaignsCodex real, submodais e banco simulados. O teste cobre abrir campanha guardada, bloquear instalação enquanto ativa, conclusão com tarefas de dois ciclos, retorno à biblioteca, histórico e botão de reinstalar. Imagens em `output/campaign-library/`. Não é prova de Android nem da execução remota do SQL. Sem commit, push ou AAB.
