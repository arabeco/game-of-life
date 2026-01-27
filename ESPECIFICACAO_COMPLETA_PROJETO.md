# Especificação Completa: Game of Life (Life Gamification)

## 🎨 Identidade Visual & Design System

### Estilo
- **Glassmorphism**: Transparência, blur (backdrop-filter), bordas sutis
- **Neo-Brutalismo**: Alto contraste, fontes limpas "Inter"/"Roboto", bordas marcadas
- **Paleta de Luxo**: Fundo prateado gradiente escuro, detalhes em **Dourado (Gold)** para níveis e **Bronze** para ações comuns
- **Grid Mestre**: Todos os ativos e modais operam em um **Grid de 6 Colunas** com **largura máxima de 420px**

---

## 📊 1. ATIVOS (Árvore da Vida)

### Visual
- Exibe as **10 áreas da vida** (Sephirot): Consciência, Físico, Finanças, Trabalho, Espaço Mental, Espiritualidade, Propósito, Projetos, Conexões, Hobbies
- Cada ativo é um círculo com ícone, label e nível

### Mecânica
- Cada ativo tem um **Nível (0-10)** definido manualmente pelo usuário (Modo Oráculo/Sovereign)

### Card de Ativo (Ao Clicar)

#### Cabeçalho
- **Botão Editar** (ícone) no canto esquerdo superior
- **Título** no centro superior
- **Símbolo** à esquerda do título
- **Botão OK** à direita do símbolo

#### Corpo
- **Box de Maestria Atual**: Texto "Nível de Maestria Atual" + **Círculo Dourado** exibindo o nível numérico

#### Rodapé
- **Miniaturas de Arenas** vinculadas àquele ativo (lado a lado)
- **Botão "Adicionar Arena"** (contorno pontilhado) simulando uma miniatura nova de arena

### Edição do Card de Ativo

Ao clicar em **Editar**:
- Upload de imagens
- Escrever textos
- Trocar wheelpickers

#### 3 Tipos de Widget

| Tipo | Nome | Grid | Uso |
|------|------|------|-----|
| **Tipo 1** | Rect-Wide | `grid-column: span 6` | Frases e títulos longos |
| **Tipo 2** | Rect | `grid-column: span 3` | Textos curtos ou Wheelpickers |
| **Tipo 3** | Square-2 | `grid-column: span 2; grid-row: span 3; aspect-ratio: 1/1` | Imagens com legenda |

#### Capacidade do Card
- **4 widgets Tipo 1** (um em cima do outro)
- **OU 6 widgets Tipo 3** (com títulos em branco acima do row ou do slot em si)

#### Layout por Ativo (Grid 6 Colunas)

**CONEXÃO:**
- Lema (Tipo 1) → Título "CRENÇAS" → 3 Crenças (Tipo 1 ou 2 conforme conteúdo)

**ESPIRITUALIDADE:**
- Título "SISTEMA" → Sistema (Tipo 1) → Título "SANTUÁRIO" → 3 Entidades (Tipo 3)

**MENTE:**
- Filosofia (Tipo 1) → Imagem (Tipo 1, altura dupla)

**TRABALHO:**
- 2 Classes (Tipo 2 cada) → Proficiências (Tipo 1 com margin-top: -10px) → Título "EXPERIÊNCIAS" → 3 Experiências (Tipo 1)

**FINANÇAS:**
- Renda/Gasto (Tipo 2 cada) → Patrimônio (Tipo 1) → Título "ATIVOS" → 3 Ativos (Tipo 2)

**AUTENTICIDADE:**
- Título "HOBBIES" → 6 Hobbies organizados em 2 linhas (Tipo 3 cada, 3 por linha)

**FÍSICO:**
- Idade/Gênero/Peso/Altura (Tipo 3 para cada um, totalizando 4 slots) → Forma Física (Tipo 1)

**Alinhamento:**
- Todo `slot-label` e `slot-value` dentro dos modais: `text-align: center`
- Utilize `display: flex; align-items: center; justify-content: center;` em todos os slots

---

## 🏟️ 2. ARENAS

### Visual
- Mostra os **cards miniatura da arena lado a lado**, por **rows de ativo**
- Exemplo: Consciência → 3 arenas de consciência → próxima linha (próximo row)
- **Botão de +** na direita inferior para criar nova arena

### Criar Arena

**Modal**: Mesmo modal do editar arena (abre ao clicar no botão editar na tela "Ver Arena")

**Card**:
- Fino e bonito
- Fundo prateado gradiente escuro luxuoso
- **NÃO ocupa a tela toda**
- Simplificando as infos da arena que você vai criar:

**Conteúdo:**
1. **Título**
2. **Ativo pertencente** (seleção)
3. **Logo escolhido** (centralizado, só abre as opções quando clica no logo para trocar)
4. **Descrição da Meta**
5. **Ações de Bronze** que tem naquela arena:
   - Em **quadradinhos de bronze** se existirem
   - **Quadradinho de bronze de nova ação** (+)
6. **Barra fina luxuosa e dourada de progresso** da meta que a pessoa setou (no fim do card)

### Ver Arena

- Ao dar OK no criar arena, ela vai para as miniaturas
- Se clicar numa miniatura (seja no card do ativo ou na aba arenas), ela abre
- O card é **parecido com o de criar arena** mas **não tem como editar** (só visualização)

---

## ⚔️ 3. AÇÕES DE BRONZE

### Criar Ação

- Ao clicar num **[+]** de bronze em uma arena, você abre o **card pequeno de bronze**
- Indica uma ação
- Segue os padrões de beleza mas é com **gradiente bronze luxuoso**

**Informações:**
1. **Ação** (nome)
2. **Arena pertencente** (já preenchida)
3. **Logo** (escolha)
4. **Slider de tempo de duração**: 15 min até 6 horas
5. **Slider de vezes por semana**: 1 a 25
6. **7 checkboxes de dias da semana**
7. **Checkbox de meta temporal**
8. **Checkbox de compromisso sério**

### Ver Ação

- Mesma coisa só que **não pode editar** a menos que clique no **botão editar ação**

---

## 📅 4. PLANNER (Core Loop)

### Cabeçalho

**Esquerda:**
- **Daypicker**: Esquerda e direita para mudar o dia
- **Pastinha de checklist** (ícone de pastinha): Ações básicas como "escovar o dente"
  - Abre a lista pequena de palavras com checkboxes
  - Ao completar todas, ela fica **brilhante** e **expira no fim do dia**
- **Símbolo de relógio**: Abre a página relatórios

**Direita:**
- **Botões Dia e Semana** para separar entre eles

### Grid de Horários

**Abaixo do cabeçalho:**
- Grid que cabe diversos **quadradinhos de bronze lado a lado**
- Tamanho bom para arrastar e ver o ícone
- **Horários na esquerda** (mesmo grid para dia e semana)

### Mecânica de Arrastar

- Ao arrastar para o planner, ele **trava transparente**
- Ao **segurar ele em um lugar do planner por 3 segundos**, ele **completa a ação**, mudando a meta da arena

### Grid Semanal

- Ao mudar para o grid semanal, mostra o **mesmo grid de horários** mas **dividido em 7 colunas**
- Com os **ícones simplificados** só com as cores ou ícones

### Histórico de Relatórios

- Ao clicar no botão **histórico**, aparecem os seus **cards miniaturas de relatórios** que você criou
- **Um em cima do outro**
- Junto com o botão **"Novo Relatório"** na parte de cima

### Novo Relatório

Ao clicar em **"Novo Relatório"**:
1. Abre modal para escolher **data início** e **data fim**
2. Após confirmar, gera um **slideshow de 5 telas** (após animação visual de scan):

**Slides:**
1. **Parabéns!** Tempo analisado, rating calculado com as infos
2. **Ações cumpridas** + **Metas batidas** + **Horas computadas**
3. **Arena mais focada** + **Ação mais feita**
4. **Resumo total** com **mapa de teia** das 10 ativos
5. **Resumo bonito** como do miniatura e **botão compartilhar card**

---

## 👥 5. SOCIAL

### Visual

**Em cima:**
- **Botão de procurar amigo** com botão de OK para dar a busca

**Área de amigos:**
- Cards dos amigos são um **card de perfil resumido horizontal de comprido**:
  - Avatar
  - Borda
  - Nickname
  - Nível geral
  - Banner
  - Nome do clã (se tiver)
  - Última vez online

**Área de membros do clã:**
- Abaixo dos amigos

### Perfil Expandido

- Ao clicar num desses cards, abre a **tela de perfil dele**
- **Card maior** com os **widgets de ativos que ele exibe** assim como as outras infos

---

## ⚙️ 6. CONFIG (Configurações)

### Menus

1. **Notificações**
   - 5 modos de notificação:
     - Modo Coach
     - Modo Focado
     - Modo Relaxado
     - Modo Silencioso

2. **LOJA**
   - EXP do jogo
   - Vê apenas: **horas investidas**, **metas batidas** e **quest cumpridas**
   - Para ganhar EXP e liberar skins

3. **Honra**
   - Vê o nível de EXP dele

4. **Maestria**
   - Edita o nível geral dele
   - **Modo Soberano**: Escolhe as frases
   - **Modo Oráculo**: Já diz as frases
   - **Sliders** para escolher o nível de cada ativo facilmente

5. **Ajuda**
   - Deletar conta, etc

---

## 👤 7. PERFIL

### Visual

- **Card bonito** que depois vamos ter **skins de como o próprio card é**

**Estrutura:**
- **Avatar no meio grande**
- **Nick** numa faixa acima do nickname
- **Círculo com o nível do player** abaixo dessa faixa de nickname, na parte debaixo do círculo do avatar
- **Borda de avatar** que ele escolheu
- **Banner** que ele escolheu abaixo

---

## 🎯 8. PROMPT MESTRE PARA IMPLEMENTAÇÃO

### Instrução Crítica para Layout de Ativos

Refaça a renderização dos slots de ativos no `tree-edit-modal` seguindo rigorosamente estas regras de **Grid de 6 Colunas**. Não altere o `styles.css` global, use as classes já existentes ou adicione estilos inline via JS para garantir a precisão matemática abaixo:

#### 1. Estrutura do Grid (6 Colunas Reais)

Aplique ao `.slot-list`:
```css
display: grid;
grid-template-columns: repeat(6, 1fr);
gap: 8px;
width: 100%;
max-width: 420px;
margin: 0 auto;
```

A altura base da linha (`--slot-grid-unit`) deve ser de `clamp(40px, 6vh, 60px)`.

#### 2. Definição Rígida dos 3 Tipos de Slots

- **Tipo 1 (rect-wide)**: `grid-column: span 6;` (Ocupa a largura total da árvore)
- **Tipo 2 (rect)**: `grid-column: span 3;` (Sempre dois por linha, simétricos)
- **Tipo 3 (square-2)**: `grid-column: span 2; grid-row: span 3; aspect-ratio: 1/1;` (Sempre três por linha, formando um bloco quadrado perfeito)

#### 3. Hierarquia de Seções (Injeção de Títulos)

Sempre que houver uma troca de grupo de informações, insira um elemento de título com:
```css
grid-column: 1 / -1;
width: 100%;
text-align: center;
font-size: 11px;
font-weight: 800;
text-transform: uppercase;
letter-spacing: 1.5px;
margin: 12px 0 4px;
```

#### 4. Configuração por Ativo (Mapa de Layout)

Ver seção "Layout por Ativo" acima.

#### 5. Alinhamento de Texto

- Todo `slot-label` e `slot-value` dentro desses modais: `text-align: center;`
- Utilize `display: flex; align-items: center; justify-content: center;` em todos os slots

---

## ✅ Status de Implementação

### ✅ Implementado
- Tela de histórico com seleção de período (5 níveis)
- Modal de seleção de datas para relatórios
- 5 cards de scan (Rating, Métricas, Destaque, Mapa de Teia, Resumo Final)
- Correção de erros Supabase
- Estilos premium (glassmorphism, iluminação, micro-interações)

### ⚠️ Parcialmente Implementado
- Grid de 6 colunas nos slots de ativos (precisa refinamento)
- Cards de histórico (lógica corrigida, precisa testar)

### ❌ Não Implementado
- Layout específico por ativo (CONEXÃO, ESPIRITUALIDADE, etc.)
- Injeção automática de títulos entre seções
- Sistema Social completo (busca, cards, perfil expandido)
- Config completo (LOJA, Honra, etc.)
- Perfil com skins
- Grid semanal unificado com grid diário

---

## 🐛 Bugs Conhecidos

1. **Geração de Relatório**: Animação de scan removida temporariamente para debug
2. **Cards do Histórico**: Lógica corrigida, adicionado evento de clique para abrir relatório

---

## 📝 Notas Técnicas

- Usar `maybeSingle()` ao invés de `single()` nas consultas Supabase
- Não usar coluna `selected_gold_assets` (não existe no schema)
- Todos os cards devem usar glassmorphism com `backdrop-filter: blur(15-20px)`
- Micro-interações com `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
