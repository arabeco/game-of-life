# 📋 ESTRUTURA DO CÓDIGO - GAME OF LIFE

## 🗂️ ARQUIVOS PRINCIPAIS

### **Frontend (Cliente)**
- **`index.html`** - Estrutura HTML principal com todas as telas e modais
- **`app.js`** - Lógica principal da aplicação (~4756 linhas)
- **`bootstrap.js`** - Inicialização e carregamento de variáveis de ambiente
- **`styles.css`** - Estilos CSS do aplicativo

### **Backend/Integração**
- **`src/lib/supabaseClient.js`** - Cliente Supabase para sincronização de dados
- **`server.js`** - Servidor (se aplicável)
- **`prisma/schema.prisma`** - Schema do banco de dados Prisma

### **Configuração**
- **`package.json`** - Dependências e scripts do projeto
- **`.env` / `R.env`** - Variáveis de ambiente
- **`.cursorrules.md`** - Regras e princípios do projeto

---

## 🎯 ESTRUTURA DO `app.js`

### **1. CONSTANTES E CONFIGURAÇÕES** (linhas 1-500)
- **Chaves de Storage**: `STORAGE_KEY`, `PLANNER_KEY`, `ARENAS_KEY`, etc.
- **SEPHIROT**: Array com 10 ativos principais (Consciência, Espaço Mental, Espiritualidade, etc.)
- **Ícones e Labels**: Mapeamento de ícones por ID de ativo
- **Frases de Maestria**: Textos descritivos para cada nível (0-10) de cada ativo
- **LAYOUT_CONFIG**: Configuração de slots por ativo (grid layout)
- **PROTOCOL_SLOTS**: Definição de slots para relatórios/protocolos

### **2. FUNÇÕES DE UTILIDADE** (linhas 500-1000)
- **Gerenciamento de Datas**: `getPlannerDateFromOffset()`, `getWeekStartDate()`, etc.
- **Parsing**: `parseDurationToMinutes()`, `formatDateKey()`, etc.
- **Validação de Ações**: `isActionDoneOnDate()`, `getActionWeeklyTarget()`, etc.

### **3. GERENCIAMENTO DE PERFIL** (linhas 1000-1500)
- **`loadProfile()`** - Carrega perfil do localStorage/Supabase
- **`saveProfile()`** - Salva perfil com sincronização
- **`setProfileCache()`** - Cache local de perfil
- **`queueSupabaseProfileUpdate()`** - Fila de atualizações para Supabase
- **`fetchSupabaseProfileRow()`** - Busca perfil do banco

### **4. GERENCIAMENTO DE DNA/ATIVOS** (linhas 1500-2000)
- **`seedDNAIfMissing()`** - Inicializa DNA padrão se não existir
- **`loadDNA()`** - Carrega estado dos ativos
- **`saveDNA()`** - Salva estado dos ativos
- **`getDossierSlots()`** - Retorna slots configurados para um ativo
- **`getSlotOptions()`** - Opções disponíveis para slots

### **5. RENDERIZAÇÃO DA ÁRVORE DE ATIVOS** (linhas 2000-2500)
- **`renderTree()`** - Renderiza grid principal de ativos (tela inicial)
- **`renderAsset()`** - Renderiza um ativo individual no grid
- **`openTreeEdit()`** - Abre modal de edição de ativo
- **`renderSlots()`** - Renderiza slots dentro de um ativo

### **6. SISTEMA DE ARENAS** (linhas 2500-3000)
- **`loadArenas()`** - Carrega arenas (metas) do storage
- **`saveArenas()`** - Salva arenas
- **`renderArenas()`** - Renderiza lista de arenas
- **`openArenaModal()`** - Modal para criar nova arena
- **`openArenaDossier()`** - Modal de detalhes da arena
- **`calculateArenaProgress()`** - Calcula progresso da arena

### **7. SISTEMA DE PLANNER** (linhas 3000-3500)
- **`initPlanner()`** - Inicializa sistema de planejamento
- **`renderTimeline()`** - Renderiza timeline diária (06h-22h)
- **`renderWeekGrid()`** - Renderiza grid semanal
- **`loadPlanner()`** - Carrega dados do planner
- **`savePlanner()`** - Salva dados do planner
- **`addPillToTimeline()`** - Adiciona "pílula" (tarefa) à timeline
- **`completePill()`** - Marca pílula como concluída (long-press)

### **8. AÇÕES DE BRONZE** (linhas 3500-3800)
- **`loadBronzeActions()`** - Carrega ações de bronze
- **`saveBronzeActions()`** - Salva ações de bronze
- **`renderBronzeList()`** - Renderiza lista de ações
- **`openBronzeModal()`** - Modal para criar/editar ação
- **`checkBronzeCompletion()`** - Verifica conclusão de ações

### **9. SISTEMA DE PROTOCOLOS** (linhas 3800-4000)
- **`generateProtocol()`** - Gera relatório/protocolo
- **`calculateProtocolStats()`** - Calcula estatísticas do protocolo
- **`openProtocolGenerateModal()`** - Modal para gerar protocolo
- **`openProtocolSlideshow()`** - Slideshow de relatórios
- **`drawSpiderChart()`** - Gráfico de teia dos ativos
- **`drawSummaryChart()`** - Gráfico de resumo

### **10. SISTEMA SOCIAL** (linhas 4000-4300)
- **`renderSocial()`** - Renderiza tela social
- **`getFriendList()`** - Busca lista de amigos
- **`saveFriendList()`** - Salva lista de amigos
- **`renderFriends()`** - Renderiza lista de amigos
- **`buildSocialSummaryCard()`** - Cria card de amigo/NPC
- **`renderNpcAllies()`** - Renderiza aliados NPCs

### **11. CONFIGURAÇÕES E UI** (linhas 4300-4600)
- **`initConfig()`** - Inicializa tela de configurações
- **`initNav()`** - Inicializa navegação inferior
- **`initClock()`** - Inicializa relógio do HUD
- **`initMoodBar()`** - Inicializa barra de humor
- **`applyTheme()`** - Aplica tema visual (Gold, Cyber, Frost, etc.)
- **`updateIntegrityBar()`** - Atualiza barra de integridade

### **12. AUTENTICAÇÃO** (linhas 4600-4700)
- **`initAuth()`** - Inicializa sistema de autenticação
- **`handleLogin()`** - Processa login
- **`handleSignup()`** - Processa cadastro
- **`handleGuestLogin()`** - Login como convidado
- **`setAuthLocked()`** - Bloqueia/desbloqueia tela de auth

### **13. INICIALIZAÇÃO PRINCIPAL** (linhas 4700-4756)
- **`initApp()`** - Função principal de inicialização
  - Carrega perfil
  - Aplica tema
  - Inicializa todos os sistemas
  - Renderiza telas
  - Sincroniza com Supabase (se habilitado)

---

## 🎨 ESTRUTURA DO `index.html`

### **Telas Principais** (data-screen)
1. **`tree`** - Árvore de Ativos (tela inicial)
2. **`arenas`** - Lista de Arenas/Metas
3. **`planner`** - Planner Diário/Semanal
4. **`social`** - Rede Social/Amigos
5. **`config`** - Configurações

### **Modais**
- **`oracle-modal`** - Modal do Oráculo (ajuste de níveis)
- **`checklist-modal`** - Checklist diário
- **`slider-modal`** - Ajuste de valores com slider
- **`banner-modal`** - Seleção de banners
- **`mood-modal`** - Ajuste de humor
- **`tree-edit-modal`** - Edição de ativo
- **`arena-modal`** - Criação de arena
- **`bronze-modal`** - Criação de ação de bronze
- **`arena-dossier`** - Detalhes da arena
- **`profile-modal`** - Edição de perfil
- **`hiato-modal`** - Modal de revalidação após hiato

---

## 💾 SISTEMA DE DADOS

### **LocalStorage Keys**
- `game_of_life.module1_dna` - Estado dos ativos
- `game_of_life.planner` - Dados do planner
- `game_of_life.arenas` - Lista de arenas
- `game_of_life.profile` - Perfil do usuário
- `game_of_life.missions` - Estado de missões
- `game_of_life.last_login` - Último login
- `game_of_life.mastery_mode` - Modo de maestria (oracle/sovereign)

### **Supabase (Opcional)**
- Sincronização de perfil
- Sincronização de dados entre dispositivos
- Sistema de amigos/seguidores
- Missões e progresso

---

## 🔄 FLUXO DE INICIALIZAÇÃO

1. **`bootstrap.js`** carrega variáveis de ambiente (`R.env`)
2. **`bootstrap.js`** importa `app.js`
3. **`app.js`** verifica autenticação
4. Se autenticado, chama **`initApp()`**
5. **`initApp()`** inicializa todos os sistemas:
   - Carrega perfil
   - Renderiza árvore de ativos
   - Inicializa planner
   - Renderiza arenas
   - Sincroniza com Supabase (se habilitado)

---

## 🎯 CONCEITOS IMPORTANTES

### **Ativos (SEPHIROT)**
10 áreas da vida representadas como ativos:
- Consciência, Espaço Mental, Espiritualidade, Propósito, Projetos, Conexões, Trabalho/Estudos, Finanças, Hobbies, Físico

### **Arenas**
Metas vinculadas a um ativo específico. Cada arena tem:
- Título e descrição
- Ativo vinculado
- Progresso (completadas/total)
- Ações de bronze associadas

### **Ações de Bronze**
Tarefas recorrentes vinculadas a arenas:
- Duração configurável
- Meta semanal (dias da semana)
- Podem ser "atemporais" ou "compromisso sério"

### **Pílulas**
Unidades de tempo no planner (06h-22h):
- Vinculadas a ações de bronze
- Concluídas via long-press (2500ms)
- Atualizam progresso da arena automaticamente

### **Protocolos**
Relatórios gerados periodicamente:
- Estatísticas dos ativos
- Gráficos de progresso
- Slideshow de períodos

---

## 🛠️ TECNOLOGIAS

- **Frontend**: Vanilla JavaScript (ES6+)
- **Backend**: Supabase (opcional)
- **Build**: Vite
- **Ícones**: Lucide Icons
- **Estilo**: CSS puro com variáveis CSS

---

## 📝 OBSERVAÇÕES

- **Zero Gamification**: Sem XP, pontos ou energia. Apenas níveis (0-10) e execução (%)
- **Long-Press Only**: Conclusão de tarefas apenas via long-press (não clique simples)
- **Dark Mode**: Design cyberpunk com cores neon
- **Hiato**: Sistema detecta ausência > 3 dias e solicita revalidação
- **Modo Oracle vs Sovereign**: Dois modos de ajuste de níveis (0-100 vs 0-10)

---

## 🎨 WIDGETS E SLOTS POR ATIVO

### **Tipos de Widgets**
- **Type 1** (`rect-wide`): Retângulo largo (span: 6 colunas)
- **Type 2** (`rect`, `rect-small`): Retângulo médio/pequeno (span: 2-3 colunas)
- **Type 3** (`square`, `square-2`): Quadrado (span: 2 colunas)
- **Type 4** (`rect-tall`): Retângulo alto
- **Type 5** (`rect-wide-tall`): Retângulo largo e alto

### **1. CONEXÃO (Consciência)**
**Layout:**
- `lema` - Type 1 (span: 6) - Lema de Vida
- `crenca1` - Type 1 (span: 6) - Crença Principal 1
- `crenca2` - Type 1 (span: 6) - Crença Principal 2
- `crenca3` - Type 1 (span: 6) - Crença Principal 3

**Protocol Slots:**
- `conexao.lema` - rect-wide - Lema de Vida
- `conexao.crenca1` - rect-wide - Crença Principal 1
- `conexao.crenca2` - rect-wide - Crença Principal 2
- `conexao.crenca3` - rect-wide - Crença Principal 3

### **2. ESPIRITUALIDADE**
**Layout:**
- `sistema` - Type 1 (gridColumn: 2/span 4) - Sistema
- `entidade1` - Type 3 (span: 2, label: "Líder") - Entidade Líder
- `entidade2` - Type 3 (span: 2, label: "Protetor") - Entidade Protetora
- `entidade3` - Type 3 (span: 2, label: "Guardião") - Entidade Guardiã

**Protocol Slots:**
- `espiritualidade.sistema` - rect - Sistema
- `espiritualidade.entidade1` - square-2 - Entidade Líder
- `espiritualidade.entidade2` - square-2 - Entidade Protetora

### **3. MENTE (Espaço Mental)**
**Layout:**
- `filosofia` - Type 1 (span: 6) - Filosofia Operacional
- `imagem` - Type 3 (gridColumn: 3/span 2) - Imagem

**Protocol Slots:**
- `mente.filosofia` - rect-wide - Filosofia Operacional

### **4. VERDADE (Propósito)**
**Layout:**
- `mtp` - Type 1 (span: 6) - Missão de Vida
- `trait1` - Type 2 (span: 3) - Trait 1
- `trait2` - Type 2 (span: 3) - Trait 2
- `signo` - Type 2 (span: 3) - Signo
- `mbti` - Type 2 (span: 3) - MBTI

**Protocol Slots:**
- `verdade.mtp` - rect-wide-tall - Missão de Vida
- `verdade.trait1` - rect-small - Trait 1
- `verdade.trait2` - rect-small - Trait 2
- `verdade.trait3` - rect-small - Trait 3
- `verdade.nascimento` - rect-small - Nascimento
  - Fields: `dia` (slider: 1-31), `mes` (slider: 1-12)
- `verdade.signo` - rect-small - Signo
- `verdade.mbti` - rect-small - MBTI
- `verdade.foto1` - square-2 - Foto 1
- `verdade.foto2` - square-2 - Foto 2
- `verdade.foto3` - square-2 - Foto 3

### **5. INSPIRAÇÃO (Projetos)**
**Layout:**
- `proj1` - Type 3 (span: 2) - Projeto 1
- `proj2` - Type 3 (span: 2) - Projeto 2
- `proj3` - Type 3 (span: 2) - Projeto 3
- `insp1` - Type 3 (span: 2) - Inspiração 1
- `insp2` - Type 3 (span: 2) - Inspiração 2
- `insp3` - Type 3 (span: 2) - Inspiração 3

**Protocol Slots:**
- `inspiracao.proj1` - square-2 - Projeto 1
  - Fields: `nome`, `logo`, `progresso`
- `inspiracao.proj2` - square-2 - Projeto 2
  - Fields: `nome`, `logo`, `progresso`
- `inspiracao.proj3` - square-2 - Projeto 3
  - Fields: `nome`, `logo`, `progresso`

### **6. AMOR (Conexões)**
**Layout:**
- `conexao1` - Type 3 (span: 2) - Conexão 1 (Família)
- `conexao2` - Type 3 (span: 2) - Conexão 2 (Família)
- `conexao3` - Type 3 (span: 2) - Conexão 3 (Família)
- `conexao4` - Type 3 (span: 2) - Conexão 4 (Amigos)
- `conexao5` - Type 3 (span: 2) - Conexão 5 (Amigos)
- `conexao6` - Type 3 (span: 2) - Conexão 6 (Amigos)

**Protocol Slots:**
- `amor.conexao1` - square - Conexão 1
  - Fields: `foto`, `nome` (Topo), `nota` (Baixo)
- `amor.conexao2` - square - Conexão 2
  - Fields: `foto`, `nome` (Topo), `nota` (Baixo)
- `amor.conexao3` - square - Conexão 3
  - Fields: `foto`, `nome` (Topo), `nota` (Baixo)
- `amor.conexao4` - square - Conexão 4
  - Fields: `foto`, `nome` (Topo), `nota` (Baixo)
- `amor.conexao5` - square - Conexão 5
  - Fields: `foto`, `nome` (Topo), `nota` (Baixo)
- `amor.conexao6` - square - Conexão 6
  - Fields: `foto`, `nome` (Topo), `nota` (Baixo)

### **7. ABUNDÂNCIA (Finanças)**
**Layout:**
- `renda` - Type 2 (span: 2) - Renda Mensal
- `gasto` - Type 2 (span: 2) - Gasto Mensal
- `patrimonio` - Type 2 (span: 2) - Patrimônio
- `ativo1` - Type 3 (span: 2) - Ativo 1
- `ativo2` - Type 3 (span: 2) - Ativo 2
- `ativo3` - Type 3 (span: 2) - Ativo 3

**Protocol Slots:**
- `abundancia.renda` - rect-wide - Renda Mensal
  - Fields: `valor` (slider: 0-50000, step: 100, unit: "R$")
- `abundancia.gasto` - rect-wide - Gasto Mensal
  - Fields: `valor` (slider: 0-50000, step: 100, unit: "R$")
- `abundancia.liquidez` - rect-wide - Liquidez
  - Fields: `valor` (slider: 0-200000, step: 100, unit: "R$")
- `abundancia.ativo1` - square-2 - Ativo 1
- `abundancia.ativo2` - square-2 - Ativo 2
- `abundancia.ativo3` - square-2 - Ativo 3

### **8. TRABALHO (Trabalho/Estudos)**
**Layout:**
- `classe1` - Type 1 (span: 6, proficiency: true) - Classe 1
- `classe2` - Type 1 (span: 6, proficiency: true) - Classe 2
- `exp1` - Type 3 (span: 2) - Experiência 1
- `exp2` - Type 3 (span: 2) - Experiência 2
- `exp3` - Type 3 (span: 2) - Experiência 3

**Protocol Slots:**
- `trabalho.pec` - rect - Classe 1
- `trabalho.unip` - rect - Classe 2
- `trabalho.personal` - rect - Classe 3
- `trabalho.cursos` - rect-wide - Cursos
- `trabalho.historico` - rect-wide - Histórico

### **9. AUTENTICIDADE (Hobbies)**
**Layout:**
- `hobby1` - Type 3 (span: 2) - Hobby 1
- `hobby2` - Type 3 (span: 2) - Hobby 2
- `hobby3` - Type 3 (span: 2) - Hobby 3
- `hobby4` - Type 3 (span: 2) - Hobby 4
- `hobby5` - Type 3 (span: 2) - Hobby 5
- `hobby6` - Type 3 (span: 2) - Hobby 6

**Protocol Slots:**
- `autenticidade.hobby1` - square-2 - Hobby 1
  - Fields: `hobby`, `logo`, `rank`
- `autenticidade.hobby2` - square-2 - Hobby 2
  - Fields: `hobby`, `logo`, `rank`
- `autenticidade.hobby3` - square-2 - Hobby 3
  - Fields: `hobby`, `logo`, `rank`

### **10. FÍSICO**
**Layout:**
- `idade` - Type 2 (span: 3) - Idade
- `genero` - Type 2 (span: 3) - Gênero
- `peso` - Type 2 (span: 3) - Peso
- `altura` - Type 2 (span: 3) - Altura
- `forma` - Type 1 (span: 6) - Forma

**Protocol Slots:**
- `fisico.peso` - rect-small - Peso
  - Fields: `kg` (slider: 40-200, step: 1, unit: "kg")
- `fisico.altura` - rect-small - Altura
  - Fields: `cm` (slider: 140-220, step: 1, unit: "cm")
- `fisico.gordura` - rect-small - %G
  - Fields: `percent` (slider: 5-40, step: 1, unit: "%")
- `fisico.flexao` - rect-tall - Flexão
  - Fields: `reps` (slider: 0-200, step: 1, unit: "x")
- `fisico.barra` - rect-tall - Barra
  - Fields: `reps` (slider: 0-50, step: 1, unit: "x")
- `fisico.corrida1` - rect-tall - Corrida 1km
  - Fields: `min` (slider: 3-20, step: 1, unit: "min")
- `fisico.corrida5` - rect-tall - Corrida 5km
  - Fields: `min` (slider: 12-60, step: 1, unit: "min")

### **Observações sobre Widgets:**
- Widgets podem ser selecionados no perfil para exibição no card de perfil
- Cada widget referencia um slot específico de um ativo (formato: `assetId.slotId`)
- Widgets podem ser visíveis ou ocultos (`widgetsVisible` array)
- Slots com `fields` definidos têm campos editáveis específicos
- Slots com `slider` têm controles deslizantes com min/max/step/unit configurados
