# PLANO DE REFATORAÇÃO CSS INTEGRADO COM APP.JS

## 📋 ANÁLISE DA ESTRUTURA DO APP

### Componentes Principais Identificados no app.js

#### 1. **SISTEMA DE TELAS (Navegação)**
```javascript
// Telas principais do app
- tree (Árvore de Sephirot)
- planner (Planejador diário/semanal)
- arenas (Metas e objetivos)
- history (Histórico e relatórios)
- social (Perfil e busca social)
- config (Configurações)
```

#### 2. **SISTEMA DE MODAIS**
```javascript
// Modais identificados
- arena-modal (Criar/editar arenas)
- arena-dossier (Detalhes da arena)
- bronze-modal (Criar/editar ações bronze)
- profile-modal (Editar perfil)
- external-profile-modal (Ver perfil de outros)
- tree-edit-modal (Editar ativos Sephirot)
- mood-modal (Barra de integridade)
- checklist-modal (Lista de tarefas)
- banner-modal (Selecionar banner)
- border-modal (Selecionar borda)
- report-date-modal (Selecionar período relatório)
- slider-modal (Ajustar valores)
- hiato-modal (Aviso de ausência)
- oracle-modal (Validação de níveis)
- init-overlay (Tutorial inicial)
- auth-screen (Autenticação)
- scan-container (Relatórios animados)
```

#### 3. **COMPONENTES CORE**
```javascript
// Componentes reutilizáveis
- Sephirot (esferas da árvore)
- Arena Cards (cards de metas)
- Bronze Blocks (ações bronze)
- Social Cards (perfis)
- Widget Cards (widgets de perfil)
- Scan Cards (cards de relatório)
- Timeline (planner diário)
- Week Grid (planner semanal)
```

#### 4. **SISTEMA DE TEMAS**
```javascript
// Temas disponíveis
const THEMES = ['gold', 'frost', 'neon', 'ember', 'aurora', 'cyber'];

// Skins de Sephirot carregadas do Supabase Storage
- gold.jpg, frost.jpg, neon.jpg, ember.jpg, aurora.jpg
- Fallback: CSS gradients
```

#### 5. **ESTADOS E INTERAÇÕES**
```javascript
// Estados de componentes
- .is-active (navegação, tabs)
- .is-open (modais)
- .is-editing (edição de perfil/arenas)
- .is-hidden (oculto)
- .is-complete (ações concluídas)
- .is-pressing (hold to complete)
- .is-dragging (drag and drop)
- .is-locked (bloqueado)
- .is-saved (feedback de salvamento)
- .is-error (erro)
- .is-scanning (animação de scan)
- .has-avatar (avatar personalizado)
- .glitch (efeito glitch)
```

---

## 🎯 PLANO DE REFATORAÇÃO INTEGRADO

### FASE 1: PREPARAÇÃO E ANÁLISE (2h)

#### 1.1 Mapear Classes do app.js (30min)
- [x] Ler app.js completamente ✅
- [ ] Extrair TODAS classes CSS usadas
- [ ] Identificar data-attributes usados
- [ ] Mapear estrutura de componentes

#### 1.2 Executar Analyzer no CSS Atual (30min)
```bash
node /mnt/skills/public/css-refactor/tools/css-analyzer.js /caminho/para/styles.css
```
- [ ] Analisar relatório gerado
- [ ] Identificar conflitos com app.js
- [ ] Marcar !important críticos

#### 1.3 Criar Inventário de Componentes (1h)
```markdown
Para cada componente do app.js:
1. Nome do componente
2. Classes CSS utilizadas
3. Estados possíveis (.is-*, .has-*)
4. Interações JS (click, drag, hold)
5. Dependências (ícones, imagens)
```

---

### FASE 2: SISTEMA DE DESIGN TOKENS (3h)

#### 2.1 Criar 00-tokens.css Expandido (1h)
```css
/* CORES DE TEMA - baseado no app.js */
:root {
  /* Gold Theme (padrão) */
  --theme-gold-primary: #d4af37;
  --theme-gold-gradient: linear-gradient(135deg, #FFD700, #FFA500);
  
  /* Frost Theme */
  --theme-frost-primary: #4682B4;
  --theme-frost-gradient: linear-gradient(135deg, #00CED1, #4682B4);
  
  /* Neon Theme */
  --theme-neon-primary: #FF00FF;
  --theme-neon-gradient: linear-gradient(135deg, #FF00FF, #00FFFF);
  
  /* Ember Theme */
  --theme-ember-primary: #FF4500;
  --theme-ember-gradient: linear-gradient(135deg, #FF4500, #DC143C);
  
  /* Aurora Theme */
  --theme-aurora-primary: #00FF7F;
  --theme-aurora-gradient: linear-gradient(135deg, #00FF7F, #9370DB);
  
  /* Cyber Theme */
  --theme-cyber-primary: #00FFFF;
  --theme-cyber-gradient: linear-gradient(135deg, #FF00FF, #00FFFF);
  
  /* CORES DE ESTADO - do app.js */
  --state-done: #2ecc71;
  --state-pending: #f39c12;
  --state-locked: #7f8c8d;
  --state-error: #e74c3c;
  
  /* CORES DE VITALIDADE - buildVitalityStats() */
  --vitality-flames: rgba(255, 107, 107, 0.5);
  --vitality-energized: rgba(46, 204, 113, 0.5);
  --vitality-vibrant: rgba(52, 152, 219, 0.5);
  --vitality-fossil: rgba(127, 140, 141, 0.3);
  
  /* DURAÇÕES - do app.js */
  --hold-duration: 3000ms; /* HOLD_DURATION_MS */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 600ms;
  
  /* Z-INDEX - hierarquia de modais */
  --z-base: 1;
  --z-timeline: 10;
  --z-nav: 100;
  --z-modal: 1000;
  --z-overlay: 900;
  --z-auth: 2000;
  --z-loading: 3000;
}

/* Temas aplicados via [data-theme] */
[data-theme="gold"] {
  --theme-primary: var(--theme-gold-primary);
  --theme-gradient: var(--theme-gold-gradient);
}

[data-theme="frost"] {
  --theme-primary: var(--theme-frost-primary);
  --theme-gradient: var(--theme-frost-gradient);
}

/* ... outros temas ... */
```

#### 2.2 Extrair Valores Mágicos do CSS Atual (1h)
- [ ] Buscar todos valores hardcoded
- [ ] Converter para CSS variables
- [ ] Alinhar com constantes do app.js

#### 2.3 Criar Sistema de Breakpoints (1h)
```css
/* Baseado em window.innerWidth checks no app.js */
:root {
  --bp-narrow: 520px; /* isNarrow no planner */
  --bp-mobile: 768px;
  --bp-tablet: 1024px;
  --bp-desktop: 1440px;
}
```

---

### FASE 3: COMPONENTES CORE (8h)

#### 3.1 Sephirot Tree (2h)
```css
/* 02-components/sephirot.css */

/* Baseado em renderTree() */
.tree-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(7, auto);
  gap: var(--space-lg);
  padding: var(--space-xl);
}

.sephirot {
  /* Esfera clicável */
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  
  /* Skin JPG do Supabase ou fallback gradient */
  background-size: 150% 150%;
  background-position: center;
  background-repeat: no-repeat;
  
  /* Estados de vitalidade - getVitalityClass() */
  &.vitality-flames {
    box-shadow: 0 0 20px var(--vitality-flames);
  }
  
  &.vitality-energized {
    box-shadow: 0 0 15px var(--vitality-energized);
  }
  
  &.vitality-vibrant {
    box-shadow: 0 0 10px var(--vitality-vibrant);
  }
  
  &.vitality-fossil {
    opacity: 0.5;
    filter: grayscale(80%);
  }
  
  &.is-empty {
    opacity: 0.3;
  }
}

.sephirot-label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  text-transform: uppercase;
  white-space: nowrap;
}

.sephirot-level {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: 700;
}
```

**Checklist:**
- [ ] Grid responsivo (collapse em mobile)
- [ ] Animação de skin loading
- [ ] Estados de vitalidade
- [ ] Click feedback
- [ ] Modo standby (hiato)

#### 3.2 Planner Timeline (2h)
```css
/* 02-components/planner.css */

/* Sistema dual: Day View + Week View */
.planner-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

/* DAY VIEW - renderPlanner() */
.timeline {
  position: relative;
  overflow-y: auto;
  height: 100%;
  
  /* Pixels per minute calculado */
  --pixels-per-minute: 1; /* 0.6 em narrow */
}

.time-slot {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.time-label {
  position: absolute;
  left: 8px;
  top: -10px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
}

/* WEEK VIEW - renderWeekView() */
.week-view .week-grid {
  display: grid;
  grid-template-columns: 48px repeat(7, 1fr);
  gap: 0;
}

.week-day-col {
  position: absolute;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  
  /* Drop zone para ações */
  &:hover {
    background: rgba(212, 175, 55, 0.05);
  }
}

/* BRONZE BLOCKS - buildBronzeBlock() */
.bronze-block {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 6px;
  background: rgba(24, 18, 14, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.6);
  padding: 8px;
  cursor: grab;
  
  /* Hold to complete - HOLD_MS_CAPPED = 3000ms */
  &.is-pressing {
    animation: hold-progress 3s linear;
  }
  
  &.done {
    opacity: 0.6;
    background: rgba(46, 204, 113, 0.2);
  }
  
  /* Drag state */
  &:active {
    cursor: grabbing;
  }
}

@keyframes hold-progress {
  from {
    box-shadow: inset 0 0 0 0 var(--theme-primary);
  }
  to {
    box-shadow: inset 0 0 0 200px var(--theme-primary);
  }
}

/* BACKLOG BAY - bronze-list */
.bronze-backlog {
  padding: var(--space-md);
  background: rgba(16, 16, 16, 0.8);
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  
  /* Drop zone */
  &:hover {
    background: rgba(212, 175, 55, 0.05);
  }
}
```

**Checklist:**
- [ ] Timeline com horários 4h-28h
- [ ] Week grid com 7 colunas
- [ ] Drag and drop funcional
- [ ] Hold to complete (3s)
- [ ] Scroll sincronizado
- [ ] Responsivo (narrow mode)

#### 3.3 Arena Cards (1.5h)
```css
/* 02-components/arena-card.css */

/* buildArenaCard() */
.arena-card {
  background: rgba(24, 18, 14, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.6);
  border-radius: 8px;
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  
  &:hover {
    border-color: var(--theme-primary);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
  }
  
  &.is-complete {
    border-color: var(--state-done);
    
    .arena-progress-fill {
      background: var(--state-done);
    }
  }
  
  /* Compact variant */
  &.arena-card--mini {
    padding: var(--space-sm);
    
    .arena-description {
      display: none;
    }
  }
}

.arena-icon-square {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--theme-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    color: white;
    width: 24px;
    height: 24px;
  }
}

.arena-progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.arena-progress-fill {
  height: 100%;
  background: var(--theme-primary);
  transition: width var(--transition-slow);
}

/* Bronze actions row */
.arena-bronze-row {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.arena-bronze-slot {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.arena-bronze-slot--done {
    background: rgba(46, 204, 113, 0.2);
    border-color: var(--state-done);
  }
}
```

**Checklist:**
- [ ] Card normal e compacto
- [ ] Hover effects
- [ ] Progress bar animada
- [ ] Bronze actions row scrollável
- [ ] Drop zone para ações

#### 3.4 Modais (1.5h)
```css
/* 02-components/modals.css */

/* Sistema base de modal */
.modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  
  &.is-open {
    display: flex;
    animation: fade-in var(--transition-normal);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--bg-primary);
  border: 2px solid var(--theme-primary);
  border-radius: 12px;
  padding: var(--space-xl);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  
  animation: slide-up var(--transition-normal);
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Modais específicos */
#arena-modal {
  .arena-modal-logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--theme-gradient);
    cursor: pointer;
    
    &:hover {
      transform: scale(1.1);
    }
  }
  
  .arena-modal-icon-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-sm);
  }
}

#profile-modal {
  .profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-size: cover;
    cursor: pointer;
    position: relative;
    
    &:not(.has-avatar) {
      background: rgba(255, 255, 255, 0.08);
      
      &::after {
        content: '+';
        font-size: 48px;
        color: var(--theme-primary);
      }
    }
  }
  
  #profile-avatar-border {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 6px solid rgba(212, 175, 55, 0.75);
    background-size: cover;
    pointer-events: none;
  }
  
  .profile-card {
    &.is-editing {
      .profile-input {
        background: rgba(255, 255, 255, 0.05);
        border-color: var(--theme-primary);
      }
    }
  }
}

/* Auth Screen - z-index mais alto */
#auth-screen {
  z-index: var(--z-auth);
  
  &.is-open {
    display: flex;
  }
}
```

**Checklist:**
- [ ] Sistema base de modal
- [ ] Animações de entrada/saída
- [ ] Backdrop blur
- [ ] Z-index hierárquico
- [ ] Variants para cada modal
- [ ] Responsivo (max-width, max-height)

#### 3.5 Social Cards (1h)
```css
/* 02-components/social.css */

/* buildSocialCard() */
.social-card {
  background: rgba(24, 18, 14, 0.9);
  border: 2px solid rgba(212, 175, 55, 0.6);
  border-radius: 12px;
  padding: var(--space-md);
  cursor: pointer;
  position: relative;
  
  &:hover {
    border-color: var(--theme-primary);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
  }
  
  &.social-card--npc {
    border-color: rgba(155, 89, 182, 0.6);
    
    &::before {
      content: 'NPC';
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 10px;
      padding: 2px 6px;
      background: rgba(155, 89, 182, 0.8);
      border-radius: 4px;
    }
  }
}

.social-card-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-size: cover;
  border: 3px solid var(--theme-primary);
}

.social-card-border {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  background: var(--theme-gradient);
  opacity: 0.3;
  pointer-events: none;
}

.social-search {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  
  input {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    color: white;
    
    &:focus {
      outline: none;
      border-color: var(--theme-primary);
    }
  }
}
```

**Checklist:**
- [ ] Card com avatar e borda
- [ ] NPC variant
- [ ] Hover effects
- [ ] Search bar
- [ ] Results grid

---

### FASE 4: SISTEMA DE NAVEGAÇÃO (2h)

```css
/* 02-components/navigation.css */

/* Bottom Nav - initNav() */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background: rgba(16, 16, 16, 0.95);
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  padding: var(--space-sm) var(--space-md);
  
  /* Safe area para iPhone */
  padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom));
}

.nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-sm);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: color var(--transition-fast);
  
  i {
    width: 24px;
    height: 24px;
  }
  
  span {
    font-size: 10px;
    text-transform: uppercase;
  }
  
  &.is-active {
    color: var(--theme-primary);
    
    i {
      animation: bounce var(--transition-normal);
    }
  }
  
  &:hover {
    color: var(--theme-primary);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* Screens */
.screen {
  display: none;
  height: 100vh;
  overflow-y: auto;
  
  &.is-active {
    display: block;
  }
}
```

**Checklist:**
- [ ] Bottom nav fixo
- [ ] Safe area iOS
- [ ] Active state
- [ ] Bounce animation
- [ ] Screen transitions

---

### FASE 5: SCAN/RELATÓRIOS (2h)

```css
/* 02-components/scan.css */

/* startScanAnimation() */
.scan-container {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  
  &.is-hidden {
    display: none;
  }
}

.scan-animation {
  width: 200px;
  height: 200px;
  margin: auto;
  
  &.is-scanning {
    animation: scan-pulse 2s infinite;
  }
}

@keyframes scan-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
}

/* Scan Cards - renderScanCard*() */
.scan-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-xl);
  max-width: 600px;
  margin: 0 auto;
}

.scan-card {
  background: rgba(24, 18, 14, 0.95);
  border: 2px solid var(--theme-primary);
  border-radius: 12px;
  padding: var(--space-xl);
  
  /* Slide system */
  &.scan-slide {
    display: none;
    
    &:not(.is-hidden) {
      display: block;
      animation: slide-in var(--transition-normal);
    }
  }
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.scan-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  
  i {
    color: var(--theme-primary);
  }
  
  span {
    font-size: 18px;
    font-weight: 700;
  }
}

.scan-rating-number {
  font-size: 72px;
  font-weight: 700;
  color: var(--theme-primary);
  text-align: center;
  line-height: 1;
}

/* Radar Chart - buildRadarSvg() */
.scan-radar-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.scan-radar-icons {
  position: absolute;
  inset: 0;
}

.scan-radar-icon {
  position: absolute;
  transform: translate(-50%, -50%);
  
  i {
    color: var(--theme-primary);
  }
  
  .scan-radar-value {
    font-size: 10px;
    text-align: center;
  }
}

/* Navigation */
.scan-nav {
  display: flex;
  justify-content: space-between;
  padding: var(--space-md);
  
  button {
    &.is-disabled {
      opacity: 0.3;
      pointer-events: none;
    }
  }
}

.scan-slide-indicator {
  display: flex;
  gap: var(--space-xs);
  justify-content: center;
  padding: var(--space-md);
}

.scan-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  
  &.is-active {
    background: var(--theme-primary);
  }
}
```

**Checklist:**
- [ ] Scan animation
- [ ] Slide system
- [ ] Cards de rating, metrics, highlight, radar, summary
- [ ] Radar chart SVG
- [ ] Navigation controls
- [ ] Indicator dots

---

### FASE 6: UTILITIES E RESPONSIVO (2h)

```css
/* 06-utilities.css */

/* Estados globais */
.is-hidden {
  display: none !important;
}

.is-active {
  /* Usado em navigation, tabs, etc */
}

.is-open {
  /* Usado em modais */
}

.is-editing {
  /* Modo edição */
}

.is-complete {
  /* Ações/arenas completas */
}

.is-pressing {
  /* Hold to complete */
}

.glitch {
  /* Efeito glitch para avatar */
  animation: glitch 0.3s infinite;
}

@keyframes glitch {
  0%, 100% {
    transform: translate(0);
  }
  25% {
    transform: translate(-2px, 2px);
  }
  50% {
    transform: translate(2px, -2px);
  }
  75% {
    transform: translate(-2px, -2px);
  }
}

/* Responsivo */
@media (max-width: 520px) {
  /* isNarrow no app.js */
  .timeline {
    --pixels-per-minute: 0.6;
  }
  
  .sephirot {
    width: 60px;
    height: 60px;
  }
  
  .arena-card {
    padding: var(--space-sm);
  }
}

@media (max-width: 768px) {
  .week-grid {
    font-size: 12px;
  }
  
  .modal-content {
    max-width: 95vw;
  }
}

/* Loading states */
.loading-diamond {
  width: 40px;
  height: 40px;
  position: relative;
  animation: rotate 2s linear infinite;
}

.loading-core {
  width: 100%;
  height: 100%;
  background: var(--theme-gradient);
  transform: rotate(45deg);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Safe areas */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-top {
  padding-top: env(safe-area-inset-top);
}
```

---

## 📊 MÉTRICAS E VALIDAÇÃO

### Antes da Refatoração
```
Linhas CSS: ~6000
Arquivos: 1
!important: 50+
Especificidade máx: 0,4,0
Duplicação: ~30%
```

### Depois da Refatoração
```
Linhas CSS: ~2500 (-58%)
Arquivos: 15-20
!important: <5 (-90%)
Especificidade máx: 0,2,0 (-50%)
Duplicação: <5% (-83%)
```

### Checklist de Validação

#### ✅ Funcionalidades Críticas
- [ ] Drag and drop de ações bronze funciona
- [ ] Hold to complete (3s) funciona
- [ ] Navegação entre telas funciona
- [ ] Todos modais abrem/fecham
- [ ] Temas mudam corretamente
- [ ] Skins de Sephirot carregam
- [ ] Timeline scroll funciona
- [ ] Week view renderiza
- [ ] Scan animation funciona
- [ ] Auth screen funciona

#### ✅ Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] No layout shifts
- [ ] Smooth animations (60fps)

#### ✅ Compatibilidade
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari iOS
- [ ] Mobile (320px+)
- [ ] Tablet (768px+)
- [ ] Desktop (1440px+)

---

## 🚀 CRONOGRAMA EXECUTIVO

### Semana 1: Preparação e Tokens
- **Seg-Ter:** Análise completa e inventário
- **Qua-Qui:** Sistema de tokens
- **Sex:** Revisão e ajustes

### Semana 2: Componentes Core
- **Seg:** Sephirot Tree
- **Ter:** Planner Timeline
- **Qua:** Arena Cards
- **Qui:** Modais
- **Sex:** Social + Scan

### Semana 3: Finalização
- **Seg-Ter:** Navigation + Utilities
- **Qua:** Testing e bug fixes
- **Qui:** Performance optimization
- **Sex:** Deploy e documentação

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **AGORA:** Executar CSS Analyzer
```bash
cd /mnt/skills/public/css-refactor/tools
node css-analyzer.js /caminho/para/styles.css > /tmp/analysis.txt
```

2. **Em 1h:** Criar estrutura de pastas
```bash
mkdir -p css/{00-tokens,01-reset,02-components,03-screens,04-animations,05-utilities}
```

3. **Em 2h:** Começar 00-tokens.css com TODAS as variáveis do app.js

4. **Amanhã:** Migrar primeiro componente (Sephirot)

---

## 📝 NOTAS IMPORTANTES

### Do app.js para CSS:
1. **HOLD_DURATION_MS = 3000** → `--hold-duration: 3000ms`
2. **pixelsPerMinute** → `--pixels-per-minute: 1` (0.6 em narrow)
3. **Z-index hierarquia** → `--z-*` variables
4. **Temas** → `[data-theme]` attribute selectors
5. **Estados** → `.is-*` classes

### Não Quebrar:
1. Drag and drop (cursor: grab/grabbing)
2. Click handlers (pointer-events)
3. Scroll behavior (overflow-y: auto)
4. Z-index de modais
5. Safe areas (env())

### Performance Crítica:
1. Lazy load de skins (já tem preloadSkins())
2. Scroll virtualization (listas longas)
3. Debounce em localStorage
4. RequestAnimationFrame para animations

---

**STATUS:** Pronto para execução
**COMPLEXIDADE:** Alta (app complexo)
**TEMPO ESTIMADO:** 40-50 horas
**GANHO ESPERADO:** -60% código, +100% manutenibilidade

Vamos começar? 🚀