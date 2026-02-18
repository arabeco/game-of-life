# ✦ GLYPH: Hermetic Sovereignty OS

**Identidade:** interface hermética em dark mode, metal dourado/prateado, ritual e peso visual.  
**Conceito:** não é lista de tarefas; é um painel de soberania pessoal onde ações viram ritos e projetos viram arenas.

## 1. Visão Geral do Produto

GLYPH é um sistema de execução diária com gamificação e ritual. O núcleo combina planejamento em grid, execução com feedback tátil/visual, fechamento diário via SITREP e evolução do Soberano por áreas de vida.

## 2. Estrutura do Domínio

O domínio é composto por Assets (áreas macro), Arenas (contextos/projetos), Ações (unidades executáveis), Tarefas Agendadas (instâncias temporais), Ciclos e Relatórios (recortes de performance), Perfil/Soberano e camada social (Clãs e Aliados). Esse conjunto sustenta o fluxo de planejar, executar, avaliar e evoluir.

## 3. Áreas do App (Telas Principais)

- **Login/Onboarding:** autenticação por email/senha, cadastro com convite dourado e integração Supabase.
- **Ativos:** árvore tipo Sephirot com níveis e dossiês por área de vida.
- **Arenas:** criação/gestão de arenas e ações, com ícones, descrições e arquivamento.
- **Planner:** visão diária/semanal com grid, agenda e execução de tarefas.
- **Relatórios:** ciclos, resultados, comparação e recompensas.
- **Social:** clãs, aliados e solicitações.
- **Configurações:** Geral, Arsenal, Maestria, Missões e Hall da Fama.
- **Perfil:** identidade do Soberano, widgets e personalização visual.

## 4. Funcionalidades por Área

- **Ativos:** dossier com slots editáveis, níveis com descrições, arenas por área e visão em árvore conectada.
- **Arenas:** ações com tipos (Ação Recorrente, Compromisso, Marco), duração, repetições, dificuldade e ícones; criação rápida e edição contextual.
- **Planner:** drag & drop, replanejamento, ações recorrentes no pool, marcos, long press para concluir e feedback visual; checklist e oráculo de input rápido.
- **SITREP Diário:** travar metas do dia, acompanhar progresso em batalha diária e gerar score final com EXP.
- **Relatórios e Ciclos:** criação de ciclos, HUD de progresso, métricas, comparador de ciclos e recompensas por desempenho.
- **Social e Clãs:** busca de aliados, convites, solicitações; clã com santuário, membros, missões e progressão.
- **Perfil/Soberano:** avatar, bordas, banners, humor, widgets, inventário e skins.
- **Arsenal e Maestria:** baús, desbloqueios cosméticos e progressão de nobreza.
- **Missões e Temporadas:** missões sazonais, quests e recompensas associadas.
- **Conquistas:** feedback de eventos (marcos, promoções e vitórias).

## 5. Premium: Codex & Vínculos

- **Codex Builder:** modo arquiteto em sandbox para criar templates de arenas/ações e exportar JSON.
- **Vínculos:** mentoria por arena com convites, cards de pupilos/mentores e feedback de satisfação.

## 6. Infraestrutura e Arquitetura

- **Frontend:** React + TypeScript com estado central em GameContext e módulos por área.
- **Dados:** Supabase para autenticação e persistência; fallback local/mock quando necessário.
- **Camadas:** contexts para jogo, tutorial e codex builder; components para UI ritualizada e modais.

## 7. Fluxo Central do Usuário

Criar arenas e ações → planejar no grid → executar com feedback → fechar o dia no SITREP → revisar ciclos e ajustar a estratégia.

## 8. Direção de Experiência

O produto prioriza peso visual, clareza e ritual. Cada ação deve parecer decisiva, o progresso precisa ser legível e a rotina diária deve ter início, meio e fim com sentido.

## 9. Roadmap (ideias futuras)

O Oráculo deve permitir entrada por texto/voz com interpretação automática. A Transferência de Codex permitirá mentores distribuírem templates via link/QR para onboarding instantâneo.

## 10. Estrutura Societária (interna)

Usar **codinomes como identificadores internos**.

Cargo | Codinome | Equity
---|---|---
CEO | FORJA | — (fundador)
Co-founder | PROTOCOLO | 7%
Legal / Tributário | TESOURO | 5%
Marketing / Ideias | SINAL | 5%
Assistente | MANUTENCAO | 3%

- Cada cargo possui **salário separado do equity** (mensal), definido internamente.
