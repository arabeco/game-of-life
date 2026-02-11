# 🏛️ Life OS: Gamified Hermetic System

**Identidade:** Interface Cyberpunk/Hermética (Dark Mode com acentos Dourados/Prateados).
**Conceito:** Não é uma lista de tarefas, é um painel de controle para "Soberania Pessoal". O usuário transforma tarefas chatas em "Ações de Bronze" e projetos em "Arenas".

---

## 1. Arquitetura Modular (Estrutura de Código)

O app foi refatorado para separar responsabilidades e facilitar a manutenção:

- **Core:** Motor do app, reset CSS, variáveis de tema, autenticação e telas de loading.
- **Profile (Identidade):** Avatar, Nível, HUD (Sliders de Humor/Energia), Inventário (Bordas/Banners).
- **Assets (A Árvore):** Atributos do personagem (Foco, Força, Espírito). Visualização em árvore (Sephirot).
- **Arenas (Contextos):** Projetos de vida (Trabalho, Casa, Treino). Contém o "Dossier" (modal de detalhes).
- **Planner (O Campo de Batalha):** Timeline diária, Grid semanal, Backlog (Bay Area) e Blocos de Ação (Bronze).
- **Analytics (Scan):** Relatórios, Gráfico de Radar, Histórico de Scores.
- **Social:** Busca de usuários, Cards de Aliados, Clãs.

---

## 2. Funcionalidades Principais (Core Features)

### A. Gestão de Vida (CRUD)

- **Visualização:** Cards distintos para Ativos, Arenas, Ações e Perfil.
- **Persistência:** Salvar todas as edições (nome, ícone, cor, peso) localmente e no banco de dados.
- **Oráculo (Input Rápido):** Botão para adicionar tarefas via Texto ou Voz ("Treino na arena físico amanhã às 11h"). O sistema interpreta (parser) e preenche o card automaticamente.

### B. O Planner (Fluxo de Trabalho)

- **Drag & Drop Tático:**
  - Arrastar do Backlog -> Timeline (Agendar).
  - Arrastar na Timeline (Reagendar).
  - Arrastar da Timeline -> Backlog (Desagendar/Guardar).
- **Recorrência:** Criação de ações que se repetem (ex: "Toda Terça e Quinta").
- **Backlog Inteligente:** Tarefas não concluídas no dia não somem; voltam para a "Bay Area" do dia seguinte automaticamente.
- **Checklists:** Sub-tarefas rápidas dentro de uma Ação ou Arena (ex: "Tomar Sol", "Vitamina").

### C. Sistema de Score (Algoritmo S.O.L.)

Um score de 0 a 100 que mede eficiência, não apenas volume.

- **Cálculo:** (Ações Feitas / Ações Planejadas) * 100.
- **Justiça:** Quem planeja pouco e cumpre = 100. Quem planeja muito e cumpre = 100.
- **XP (Experience):** Dias mais cheios dão mais XP absoluto para subir de nível, mas o Score de qualidade do dia independe do volume.
- **Relatório Diário:** Ao fechar o dia, mostra o Score, XP ganho e gera uma imagem compartilhável.

---

## 3. A "Transferência de Codex" (Ideia do Usuário)

Funcionalidade Multiplayer/Platform para Personal Trainers e Mentores.

- **O Conceito:** Criar e compartilhar "Planos de Ação" via Link/QR Code.
- **O Criador (Mentor):**
  1. Cria um pacote contendo: Arenas sugeridas + Ações Recorrentes + Checklists Diárias.
  2. Gera um link (ex: app.com/protocol/hipertrofia-xyz).
- **O Receptor (Aluno):**
  1. Clica no link e vê o modal "Protocolo Detectado".
  2. Ao aceitar: O app cria as arenas automaticamente e povoa a agenda futura do aluno com os treinos e dietas.
- **Valor:** Facilita o onboarding de alunos e cria viralidade para o app.

---

## 4. Ideias de Expansão (Selecionadas)

Estas são as mecânicas para aumentar a retenção e a imersão:

### 🎮 Gamificação

1.  **Protocolo Fênix (Botão de Pânico):** Um botão nas configs para "queimar" (arquivar) todo o backlog atrasado de uma vez, zerando a culpa e dando um bônus de XP de "Renascimento".
2.  **Drops de Loot:** Chance aleatória (RNG) de ganhar cosméticos (ícones raros, bordas de avatar, temas de cor) ao completar dias com Score 100.
3.  **Árvore Dinâmica:** (Já iniciado) A aparência visual da Tree (Sephirot) muda conforme o uso. Se não treinar por 3 dias, a esfera "Força" racha ou apaga. Se treinar, ela brilha intensamente.

### 📱 Utilidade

6.  **Widget "Próxima Batalha":** Widget nativo (Android/iOS) na home do celular mostrando apenas a próxima tarefa e horário, estilo "Pager".
12. **Design de Som Dourado:** Efeitos sonoros satisfatórios (bainha de espada, clique mecânico, sons graves) para ações de completar e arrastar.

### 🤝 Social

9.  **Raid de Clã:** Objetivos coletivos semanais (ex: "O Clã precisa somar 50 horas de Foco"). Se baterem a meta, todos ganham um banner exclusivo.
10. **O Vigilante (Accountability):** Designar um amigo para receber notificação se você não cumprir sua tarefa mais importante (Highlight) até certo horário.
14. **Shareable Score:** (Semi-implementado) Gerar imagem quadrada estilosa com o Score do dia, insígnias das arenas trabalhadas e frase do oráculo para postar no Instagram Stories.
