## MISSÃO 1 — AUDITORIA COMPLETA (7 abas) — Checklist global numerado
### 1) Perfil
Funcionalidades existentes

- 1. Modal de Perfil em overlay, fecha ao clicar fora e por botão de fechar.
- 2. Cartão “compartilhável” do perfil renderizado offscreen + fluxo de share.
- 3. Modo editar/salvar/cancelar para dados do perfil (patch parcial via contexto).
- 4. Troca de avatar via modal (upload/seleção).
- 5. Troca de borda via modal (com gates de unlock/role).
- 6. Troca de background (imagem/gradiente) via modal, com overlay de edição.
- 7. Troca de banner via modal + render condicional.
- 8. Exibição do clã + rank do clã com abertura do modal do clã.
- 9. Sistema de widgets (lista visibleWidgets ) renderizados em grid.
- 10. Resolução de widget por slotId → Asset/Slot (parse assetId.slotKey ).
- 11. Skin aplicada como identidade visual (accent derivado de userProfile.skin ).
- 12. Sync/persistência do perfil via Supabase (upsert de user_profiles com jsonb de unlocks etc).
Nota (0–10): 7.5

Falta para chegar no 10 (gaps reais, sem inflar)

- UI do Perfil não é o “hub” de equipar (hoje fica muito em Configurações/Arsenal).
- Widgets hoje são “display”; faltam ações diretas (eles não editam o slot por toque).
- Consistência de “identidade”: o Perfil mostra muita estética, mas pouca alavanca prática (atalhos de equipar/editar).
Dicas (somente as que você aprovou)

- “Hub de identidade” enxuto: equipar Skin/Borda/Banner/Artefato no Perfil (atalho), sem inventário gigante duplicado. (talvez — para discutir)
- Widget com ação: tocar no widget abre o editor do slot correspondente (zero navegação extra). (difícil, mas não é impossível: é wiring de navegação + abrir InputModal com o slot resolvido)
### 2) Ativos
Funcionalidades existentes

- 13. Tela Sephirot em layout fixo (10 ativos) com grid 3x7.
- 14. Shader/névoa no fundo alimentado por nível dos ativos.
- 15. Clique no ativo abre o Dossiê do Ativo (troca de estado local).
- 16. Dossiê com slots editáveis (valores por slot).
- 17. Edição de slot via InputModal (suporta tipos/layouts diferentes).
- 18. Acesso a arenas do ativo e abertura do modal de arena.
- 19. Criação de arena a partir do contexto do ativo (com seleção de ativo “geral/sidequest” disponível no app).
Nota (0–10): 8.0

Falta para chegar no 10 (gaps reais, sem inflar)

- A transição “Sephirot → Dossiê” é funcional, mas ainda parece “troca de tela”, não “zoom/mergulho”.
- O Dossiê poderia reforçar mais a sensação de estar “dentro” daquele ativo (ambientação visual coerente).
Dica (nova, aprovada por você)

- Zoom Sephirot : ao clicar num ativo, parecer que você deu zoom e “entrou na esfera” — por exemplo:
  - transição animada (scale + fade) da esfera para o Dossiê, ou
  - o modal/dossiê renderizar uma Sephirot ampliada/desfocada no fundo, como se o usuário estivesse dentro do ativo.
### 3) Arenas
Funcionalidades existentes

- 20. Listagem de arenas com toggle de “mostrar arquivadas”.
- 21. Pastas de arenas (criar/editar/excluir).
- 22. Modal de pasta com lista de arenas e ações de organização.
- 23. Reordenação/drag de arenas (suporte no estado/handler).
- 24. Criar arena via modal (nome/descrição/ativo).
- 25. Abrir ArenaDetailModal ao selecionar uma arena.
- 26. Editar arena (nome/descrição/ícone) com IconPicker.
- 27. Excluir arena com confirmação.
- 28. Listar ações por tipo (Marco vs não-Marco).
- 29. Abrir ActionModal em modo view ao tocar numa ação.
- 30. Criar ação pela arena (bloqueado em arenas especiais de quests).
- 31. Modo Arquiteto (sandbox) dentro da aba Arenas (criar arena + ações sem afetar jogo atual).
Nota (0–10): 7.8

Falta para chegar no 10 (gaps reais, sem inflar)

- Regras de tipos (Marco/Compromisso/Recorrente) existem, mas ainda são mais “UI” do que comportamento forte no sistema.
- Integração do “Modo Arquiteto/Codex” com o jogo real ainda é parcial (sandbox isolado).
Dicas

- (nenhuma — você pediu para remover as outras)
### 4) Planner
Funcionalidades existentes

- 32. Alternância Dia/Semana com navegação temporal.
- 33. Grid com indicador de tempo atual + auto-scroll pro “agora”.
- 34. Zoom do grid (níveis).
- 35. Bay Area (task pool) agrupada e renderizada por contexto.
- 36. Drag & drop completo (ghost, offset, targets, drop indicators).
- 37. Auto-scroll durante drag.
- 38. Reagendar tarefa por drag (mudar dia/horário).
- 39. Soltar na Bay Area retorna ao pool (ou remove se for Marco).
- 40. Agendar ação nova do pool no grid via drop.
- 41. Milestone pool separado (ações Marco não executadas).
- 42. Long press para completar + toggle de conclusão.
- 43. Abrir ActionModal a partir do Planner.
- 44. Checklist modal (itens do checklist via contexto).
- 45. SITREP modal: compromisso do dia, ajuste tático, gerar score final.
- 46. Oráculo: parsing pt-BR (hora, dias da semana, aspas) e criação/agendamento.
Nota (0–10): 8.4

Falta para chegar no 10 (gaps reais, sem inflar)

- O loop diário ainda tem atrito em recorrência: ações com dias+horário não “nascem” automaticamente no grid.
Dicas (somente a que você aprovou)

- “Poder real” sem barulho: auto-instanciar ações recorrentes no grid (se tem dias+hora). Isso reduz atrito sem alertar ninguém.
### 5) Social
Funcionalidades existentes

- 47. Estado “sem clã” com CTA para fundar clã.
- 48. Busca social (players/clãs) com cards de resultado.
- 49. Enviar solicitação de amizade.
- 50. Aceitar/recusar solicitações + contagem de pendências.
- 51. Entrar em clã (joinClan).
- 52. Modal do clã com tabs (santuário/membros/missões).
- 53. Santuário do clã (grid 6x6) com posicionamento/ocupação.
- 54. Membros: lista + ações administrativas (kick/transfer/leave) quando permitido.
- 55. Missões do clã: cards com progresso, participantes e participação (joinClanMission / progress).
Nota (0–10): 7.6

Falta para chegar no 10 (gaps reais, sem inflar)

- Confiabilidade/consistência do multiplayer (participantes/progresso) precisa ser impecável para o social “parecer real”.
- “Procurar Clã” no estado sem clã ainda está fraco (fluxo de descoberta incompleto).
Dicas

- (nenhuma — você pediu para remover as outras)
### 6) Configurações
Funcionalidades existentes

- 56. Tabs internas: Geral, Arsenal, Maestria, Missões, Hall da Fama.
- 57. Geral: sliders/avaliação (questionário com labels e frases).
- 58. Arsenal: inventário por categorias (baús, artefatos, skins, bordas, banners).
- 59. Arsenal: gates de unlock por role/rank/season.
- 60. Baús: abrir e gerar recompensa (com unlock de item/skin).
- 61. Equipar Skin/Borda/Banner/Artefato via ItemDetailModal (updateUserProfile).
- 62. Maestria: view dedicada.
- 63. Missões: quests da season (aceitar/claim reward).
- 64. Missões: quests do clã com participantes e progresso.
- 65. Missões: missões principais e introdutórias.
- 66. Hall da Fama: view dedicada.
Nota (0–10): 8.1

Falta para chegar no 10 (gaps reais, sem inflar)

- Missões/Seasons têm risco de fonte dupla (constantes vs DB) — precisa clareza de “fonte da verdade”.
- Inventário existe, mas a navegação de equipar poderia ser mais direta (por isso seu “talvez” de hub no Perfil).
Dicas

- (nenhuma — você pediu para remover as outras)
### 7) Funções Avançadas
Funcionalidades existentes

- 67. Painel do Soberano (tela separada).
- 68. Convites dourados: listar/gerar/copiar + seed inicial.
- 69. Seasons: listar ativa/futuras/passadas e iniciar criação/edição.
- 70. Missões de season (admin): listar e adicionar SeasonMission.
- 71. Estrutura de “Modo Arquiteto/Codex Builder” existe como sandbox dentro de Arenas (separado do jogo real).
Nota (0–10): 6.9

Falta para chegar no 10 (gaps reais, sem inflar)

- Falta um Assistente de IA formal (feature real, não conceito) e com função clara.
- Falta um caminho “codex/template → aplicar no jogo real” sem fricção.
Dicas (somente a que você aprovou)

- Assistente de IA (quando entrar) no papel certo: reduzir atrito (criar arena/ação, sugerir rotina), não “monitorar”.