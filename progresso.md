# PROGRESSO HISTORICO: GLYPH
Data de consolidacao: 24/03/2026
Fonte: itens [v] removidos do relatorio operacional

## Fechamento 24/03/2026
[v] Desligar a economia de `slots` e consolidar a camada social em Ouro direto (`Mentoria 100`, `Parceria 50`, `Competicao 50`, arena extra `50`), com SQL aplicado e copy publica puxada para `Campanha`/`Grupo`.
[v] Integrar `Tarefas do grupo` ao board oficial de arenas: quest/tarefa aceita vira arena real, abre `ArenaDetailModal` e limpa participacao/arena vazia no retorno.
[v] Entregar o `modo lista` da `ArenasView`, restaurar o scroll vertical mobile e preservar reorder em `Livre/Prioridades`, com expandir de todas as acoes por arena.
[v] Lapidar a visualizacao compacta das arenas no mobile: card achatado, tipografia/icone ajustados, badge do ativo nos circulos e limpeza do modulo `Grupo`/copy publica residual.
[v] Reestruturar a tela de `Ativos` como painel operacional: resumo fino do ciclo, cards por ativo nas posicoes oficiais, barrinhas finas de progresso, tint sutil por ativo e leitura melhor em dark/light.
[v] Iniciar a convergencia publica `GAME/BASIC -> Modo Jogo`: nave unificada, `Ativos` voltando para todos, perfil em `Resumo/Widgets/Maestria` e `Modo Jogo` centralizado em `Preferencias`.
[v] Revisar onboarding e tutoriais para o novo modelo `core + Modo Jogo`, com cards `1/2` no basico, cards `3/4` ligados ao toggle, copy alinhada e checagem final de anchors, `type-check` e `build`.
[v] Reorganizar a arquitetura interna das superficies premium: `Campanhas` com acesso principal em `Arenas`, `Vinculos` com botao/modal proprio no `Social` e aba `Premium` reduzida para status, beneficios e renovacao.
[v] Refatorar a loja/catalogo de `Campanhas`: grid compacto mobile, separacao `Gratis/Premium`, filtros por ativo/tipo/tema, primeiras microaulas de `Aprendizado` via `Anotacao` e seed de campanhas gratis base.
[v] Implementar assinatura `Premium` real de `30 dias`, com expiracao persistida no perfil, renovacao acumulando validade, modal de recompensa no padrao da `Vanguarda` e entrega real de bau/cosmeticos sazonais quando faltarem.
[v] Fechar o onboarding happy-path sob automacao local: termos, ciclo inicial, criacao de arena, criacao de acao e conclusao do onboarding sem seletor inicial de modo, com smoke dedicado validando o trilho principal.
[v] Fechar a camada social compartilhada de base no remoto: criacao de `Grupo` com Ouro via RPC, missao/tarefa de grupo ativa, `Mentoria` com arena em leitura para o pupilo, `Parceria` com arenas mostradas dos dois lados e `Competicao` espelhada com vencedor, bau e notificacao do perdedor.
[v] Unificar a abertura de bau no modal padrao de recompensa: inventario e fim de ciclo agora convergem para o mesmo ritual, com CTA de abrir bau direto no relatorio final.
[v] Amarrar o modal de `Arena Completa` por modo: no basico ele so confirma com `OK`, e no `Modo Jogo` libera o CTA de compartilhar o feito.

## Entregas consolidadas
[v] Fechar o laboratorio de notificacoes do GM com 3 botoes previsiveis (`Sistema Agora`, `Card do Oraculo`, `Sistema + Push 15s`) e destaque correto em `Avisos`/Oraculo.
[v] Validar o PIX real do Mercado Pago ate o credito de ouro na conta, com QR funcional, status em pt-BR, toast de sucesso e fechamento automatico apos a aprovacao.
[v] Adicionar atalho por `hold` da `Checklist` na `RestScreen`, abrindo a lista por cima da tela de descanso e zerando no reset operacional das `04:00`.
[v] Subir `Humor` + `Rascunho operacional` na `RestScreen`, com salvamento por dia operacional em `daily_commitments.operational_scratch`.
[v] Reconstruir a `Central de Vinculos` em formato compacto por tipo, empurrando arenas e campanhas para dentro da mentoria e levando convites de vinculo para `Solicitacoes` no Social.
[v] Lapidar a projecao final do `Legado` para vitrine mobile: navegacao manual, cena final, HUD mais discreto, PWA fullscreen e preset aprovado travado na composicao.
[v] Publicar e validar em `app.glyph.life` o pacote atual de Login/Codex/Mentoria/Planner/Vinculos e fechar o smoke real consolidado no celular.
[v] Fortalecer o `marco1_beta_tracking`/GM Panel em uso real e transformar o painel em vitrine: snapshot editorial, legado premium preenchido e preview de relatorio de ciclo nota `S` pronto para print.
[v] Empurrar Termos/Privacidade do cadastro manual para o ritual pos-login, alinhando o fluxo manual ao retorno autenticado do Google.
[v] Blindar o compartilhamento e os atritos mais visiveis do mobile/planner: cancelamento de imagem sem erro falso, hold sem selecao, bay area recuando de altura e edicao de acao mais segura.
[v] Entregar a primeira passagem da `Central de Vinculos` no padrao luxe, separando vinculo de arena vinculada e conectando custos, slots e Loja para Parceria, Competicao e Mentoria.
[v] Estruturar o backend do novo pacote social: `relationship_link_arenas`, RPCs monetizadas com refund, limite de `2` Codex de mentoria e migration compatibilizada com banco legado.
[v] Blindar o retorno do OAuth Google para nao cair de volta na LoginView: memoria curta de auth pendente, retry de sessao e boot mais estavel no primeiro retorno do provedor.
[v] Criar funcao "Comecar Agora" e estabilizar o comportamento da tela bloqueada no fluxo.
[v] Fechar o furo do custo de envio de Codex.
[v] Fechar Loja: validar compra de Slots e claim por link; revisar items e Codex no catalogo.
[v] Criar Codex base de teste (Ativ. Fisica, Nutricao, Mentais, Logistica).
[v] Revisao da Loja: validar fluxo de compra de Slots, Codex e items; alinhar Biblioteca e Loja ao padrao GlassCard.
[v] Publicar e validar em ambiente real (Vercel) o que foi fechado localmente.
[v] Varredura final de encoding em Settings e CodexModal.
[v] Padronizar a UI mobile de modais centrais em Perfil, Loja, Arena e Assets.
[v] Reestruturar o card/modal de Season com foco em imagem, descricao e cards compactos.
[v] Ajustar a customizacao de Soberano, Artefato, Glifo, Aura e Placa no perfil.
[v] Renovar temporariamente os fundos Ouro e Prata do perfil com versoes escuras texturizadas.
[v] Preparar os novos backgrounds `goldback`, `silverback`, `emeraldback`, `rubiback` e premium extras em `use assets`.
[v] Reestruturar o acesso do beta fechado: bloquear entrada sem conta, autenticar Google, pedir Bilhete Dourado em modal e liberar so apos validacao.
[v] Ajustar o onboarding inicial para terminar na Rest Screen e apontar para `Configuracoes > Tutoriais`.
[v] Corrigir o Oraculo em `app.glyph.life` com ajuste de CORS e deploy da Edge Function `oracle`.
[v] Blindar a exclusao de conta ponta a ponta: fix do `account-delete`, grants/RLS corrigidos, FKs em cascata, limpeza de sessao local e bloqueio de reentrada validado em conta real.
[v] Reorganizar Login, modal de selecao de modo e feedback do Bilhete Dourado no padrao visual atual, com foco em clareza, estado e mobile.
[v] Validar em smoke e conta real o pacote `Google -> Bilhete -> Modo -> Onboarding -> Oraculo -> exclusao`, corrigindo hold-state, claim de convite e schema remoto.
[v] Reforcar o sistema de Codex/Mentoria: mentor so Premium, forja para pupilo por `300 ouro`, entrega autoral via RPC e limite de slots blindado no backend.
[v] Unificar Loja, Biblioteca e Claim de Codex no padrao luxe, restaurar o catalogo e estruturar os formularios `Mini -> Fase 2` para curadoria de mentores.
[v] Refatorar os criativos de aquisicao para dar mais consistencia visual aos Reels, prints e pecas publicas do GLYPH.
[v] Fechar a varredura tecnica do pacote atual com `type-check` e `check:encoding` verdes, limpando temporarios, drift de tipos e residuos de alpha.
[v] Expandir `marco1_beta_tracking` e o GM Panel para incluir jogadores de `Bilhete Ouro`, esconder GMs do scoreboard e deixar o dashboard operacional mais limpo e legivel.
[v] Limpar mocks e fallbacks visiveis do alpha, removendo perfis fake, placeholders externos e paineis de debug que ainda piscavam antes da hidratacao real.
[v] Refinar onboarding guiado, Planner, Rest Screen e perfil publico no mobile: passos reais de ciclo/arena/acao, bay global, duracao coerente no drop, drag mais proximo do dedo, boot menos ruidoso e ativos/maestria mais privados.
[v] Fazer uma adaptacao sutil para iPhone/PWA e navegacao manual: holds sem selecao acidental, `Entrar com e-mail`, troca de ativo pai da arena e header do Planner fixo na rolagem.
