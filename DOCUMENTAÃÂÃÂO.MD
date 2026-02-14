# 🏛️ Life OS: Gamified Hermetic System

**Identidade:** Interface cyberpunk/hermética (Dark Mode com acentos dourados/prateados).
**Conceito:** Não é uma lista de tarefas, é um painel de soberania pessoal. Tarefas viram Ações e projetos viram Arenas.

---

## 1. Visão Geral do Produto

Life OS é um sistema de gamificação da vida com foco em execução diária, progresso por áreas e identidade visual forte. O app combina agenda, rituais de fechamento (SITREP), ciclos de performance e evolução do soberano.

---

## 2. Estrutura do Domínio

- **Assets (Árvore de Vida):** áreas macro de evolução com slots visuais.
- **Arenas:** projetos/contextos vinculados a um Asset.
- **Ações:** unidades executáveis com duração, tipo e dificuldade.
- **Tarefas Agendadas:** instâncias de ações posicionadas no tempo.
- **Ciclos e Relatórios:** recortes de performance com métricas e highlights.
- **SITREP Diário:** ritual de fechamento com score e travamento de metas.
- **Clãs:** organização social com membros e progressão.
- **Perfil e Soberano:** identidade, nível e personalização.

---

## 3. Funcionalidades Atuais

### A. Gestão de Vida (CRUD)

- Criar, editar e excluir Arenas e Ações.
- Ações possuem duração, tipo (Recorrente, Compromisso, Marco) e dificuldade.
- Persistência local e sincronização com Supabase quando logado.

### B. Planner (Campo de Batalha)

- Drag & drop do estoque para timeline e replanejamento.
- Visão diária e semanal com escala de horários.
- Long press para concluir tarefas com feedback visual.
- Marcos com comportamento próprio e tratamento especial.
- Zoom do grid para ajuste de densidade visual.

### C. Agendamento

- Ações recorrentes agendadas por dias da semana.
- Compromissos com data e horário específicos.
- Reagendamento direto no grid.

### D. Rituais e Métricas

- SITREP diário com score e travamento de metas.
- Ciclos com relatório de performance e métricas agregadas.
- Evolução de nível baseada no progresso das áreas.

### E. Social e Clãs

- Criação e gestão de clãs.
- Entrada, saída e expulsão de membros.
- Busca e ingresso em clãs.

### F. Identidade e UI

- Avatar do soberano e personalização visual.
- UI com glassmorphism e feedbacks contínuos de progresso.

---

## 4. Fluxos Principais do Usuário

1. Criar Assets, Arenas e Ações.
2. Planejar Ações no Planner (drag, data e horário).
3. Executar tarefas e concluir via long press.
4. Travar metas e fechar o dia no SITREP.
5. Revisar ciclos e ajustar estratégia.

---

## 5. Direção de Experiência

- Clareza e peso visual: cada ação deve parecer decisiva.
- Progresso visível: feedback constante e legível.
- Ritual diário: o fechamento do dia é parte central do produto.

---

## 6. Ideias Futuras (Mantidas no Roadmap)

### A. Oráculo (Input por Texto/Voz)

Entrada rápida por texto ou voz que interpreta intenção e agenda automaticamente ações.

### B. Transferência de Codex

Mentores criam pacotes de arenas e ações com link/QR para onboarding imediato de alunos.
