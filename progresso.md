# PROGRESSO HISTORICO: GLYPH
Data de consolidacao: 18/03/2026
Fonte: itens [v] removidos do relatorio operacional

## Entregas consolidadas
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
