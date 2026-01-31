# PADRÕES CSS - SLOTS DOS ATIVOS (SEPHIROT)

## 🎯 OBJETIVO

Padronizar todos os slots dos ativos com CSS reutilizável, eliminando código duplicado e mantendo consistência visual.

---

# 📋 TIPOS DE SLOTS

## 🔹 TIPO 1 - RETÂNGULO COMPRIDO (FULL WIDTH)

### Características
- **Formato**: Retângulo comprido (linha inteira)
- **Grid**: `grid-column: 1 / -1` (6 colunas)
- **Altura**: 46px total
- **Uso**: Textos longos, frases, valores principais

### Estrutura
```
┌─────────────────────────────────────┐
│ TÍTULO (16px)                      │
├─────────────────────────────────────┤
│ VALOR (28px)                       │
└─────────────────────────────────────┘
```

### CSS Base
```css
/* CONTAINER DO SLOT TIPO 1 */
.slot-tipo-1 {
  grid-column: 1 / -1 !important;
  min-height: 46px !important;
  max-height: 46px !important;
  height: 46px !important;
  padding: 4px 6px !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  gap: 2px !important;
}

.slot-tipo-1 .slot-label {
  margin-bottom: 0px !important;
  min-height: 16px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
  text-align: center !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
}

.slot-tipo-1 .slot-value {
  min-height: 28px !important;
  max-height: 28px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  border-radius: 10px !important;
  padding: 4px 6px !important;
  background: rgba(16, 16, 16, 0.6) !important;
  font-size: 12px !important;
  color: #f7f7f7 !important;
  text-align: center !important;
}

.slot-tipo-1 .profile-input {
  display: flex !important;
  min-height: 28px !important;
  max-height: 28px !important;
  height: 28px !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  border-radius: 10px !important;
  padding: 4px 6px !important;
  background: rgba(16, 16, 16, 0.6) !important;
  font-size: 12px !important;
  color: #f7f7f7 !important;
  text-align: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  outline: none !important;
  font-family: "JetBrains Mono", "Consolas", "Courier New", monospace !important;
  line-height: 1.2 !important;
  position: relative !important;
  z-index: 10 !important;
  pointer-events: auto !important;
  box-shadow: none !important;
}

.is-editing .slot-tipo-1 .slot-value {
  display: none !important;
}
```

---

## 🔹 TIPO 2 - QUADRADO (2×2)

### Características
- **Formato**: Quadrado perfeito
- **Grid**: `grid-column: span 2; grid-row: span 2`
- **Altura**: 94px (2 × 46px)
- **Uso**: Imagens, conteúdo médio, ícones

### Estrutura
```
┌─────────────┬─────────────┐
│ TÍTULO (16px)│ TÍTULO (16px)│
├─────────────┼─────────────┤
│             │             │
│   VALOR     │   VALOR     │
│   (FLEX 1)  │   (FLEX 1)  │
│             │             │
└─────────────┴─────────────┘
```

### CSS Base
```css
/* CONTAINER DO SLOT TIPO 2 */
.slot-tipo-2 {
  grid-column: span 2 !important;
  grid-row: span 2 !important;
  min-height: 94px !important;
  max-height: 94px !important;
  height: 94px !important;
  padding: 4px 6px !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  gap: 2px !important;
}

.slot-tipo-2 .slot-label {
  margin-bottom: 0px !important;
  min-height: 16px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
  text-align: center !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
}

.slot-tipo-2 .slot-value {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  border-radius: 10px !important;
  padding: 4px 6px !important;
  background: rgba(16, 16, 16, 0.6) !important;
  font-size: 12px !important;
  color: #f7f7f7 !important;
  text-align: center !important;
}

.slot-tipo-2 .profile-input {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  border-radius: 10px !important;
  padding: 4px 6px !important;
  background: rgba(16, 16, 16, 0.6) !important;
  font-size: 12px !important;
  color: #f7f7f7 !important;
  text-align: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  outline: none !important;
  font-family: "JetBrains Mono", "Consolas", "Courier New", monospace !important;
  line-height: 1.2 !important;
  position: relative !important;
  z-index: 10 !important;
  pointer-events: auto !important;
  box-shadow: none !important;
}

.is-editing .slot-tipo-2 .slot-value {
  display: none !important;
}
```

---

## 🔹 TIPO 3 - RETÂNGULO FINO (2×1)

### Características
- **Formato**: Retângulo fino
- **Grid**: `grid-column: span 2; grid-row: span 1`
- **Altura**: 46px
- **Uso**: Valores curtos, números, status

### Estrutura
```
┌─────────────┬─────────────┐
│ TÍTULO (16px)│ TÍTULO (16px)│
├─────────────┼─────────────┤
│ VALOR (28px) │ VALOR (28px) │
└─────────────┴─────────────┘
```

### CSS Base
```css
/* CONTAINER DO SLOT TIPO 3 */
.slot-tipo-3 {
  grid-column: span 2 !important;
  grid-row: span 1 !important;
  min-height: 46px !important;
  max-height: 46px !important;
  height: 46px !important;
  padding: 4px 6px !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  gap: 2px !important;
}

.slot-tipo-3 .slot-label {
  margin-bottom: 0px !important;
  min-height: 16px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
  text-align: center !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
}

.slot-tipo-3 .slot-value {
  min-height: 28px !important;
  max-height: 28px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  border-radius: 10px !important;
  padding: 4px 6px !important;
  background: rgba(16, 16, 16, 0.6) !important;
  font-size: 12px !important;
  color: #f7f7f7 !important;
  text-align: center !important;
}

.slot-tipo-3 .profile-input {
  display: flex !important;
  min-height: 28px !important;
  max-height: 28px !important;
  height: 28px !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  border-radius: 10px !important;
  padding: 4px 6px !important;
  background: rgba(16, 16, 16, 0.6) !important;
  font-size: 12px !important;
  color: #f7f7f7 !important;
  text-align: center !important;
  width: 100% !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  outline: none !important;
  font-family: "JetBrains Mono", "Consolas", "Courier New", monospace !important;
  line-height: 1.2 !important;
  position: relative !important;
  z-index: 10 !important;
  pointer-events: auto !important;
  box-shadow: none !important;
}

.is-editing .slot-tipo-3 .slot-value {
  display: none !important;
}
```

---

# 🎯 GRID PADRÃO (6 COLUNAS)

## Configuração Base
```css
.grid-padrao-6x4 {
  display: grid !important;
  grid-template-columns: repeat(6, 1fr) !important;
  grid-template-rows: repeat(4, 46px) !important;
  gap: 6px !important;
  padding: 0px !important;
  max-height: 184px !important;
  overflow: hidden !important;
  width: 100% !important;
  max-width: 420px !important;
  margin: 0 auto !important;
}
```

## Dimensões
- **Total**: 6 colunas × 4 linhas = 24 células
- **Altura**: 184px (4 × 46px)
- **Largura**: 100% (max 420px)
- **Gap**: 6px entre todos os elementos

---

# 🔧 COMO USAR

## 1. Aplicar Classes Base
```javascript
// No renderTreeEditorSlots, adicionar classes base
slotEl.classList.add('slot-tipo-1'); // ou slot-tipo-2, slot-tipo-3
```

## 2. Configurar Grid do Ativo
```css
/* Para cada ativo */
#tree-edit-modal[data-asset-id="consciencia"] .slot-list {
  @extend .grid-padrao-6x4;
}
```

## 3. Posicionamento Específico (se necessário)
```css
/* Exemplo: Slot específico em posição customizada */
#tree-edit-modal[data-asset-id="consciencia"] .slot-list .profile-slot[data-slot-id="consciencia.crenca1"] {
  grid-column: span 3 !important;  /* Metade da largura */
  grid-row: span 1 !important;     /* 1 linha */
}
```

---

# 📋 MAPEAMENTO DE ATIVOS

## CONSCIÊNCIA
- **Slots**: 4 × Tipo 1 (lema + 3 crenças)
- **Layout**: 4 linhas, largura total

## ESPAÇO MENTAL
- **Slots**: 1 × Tipo 1 (filosofia) + 3 × Tipo 2 (conexões)
- **Layout**: Linha 1: full, Linhas 2-3: 3 quadrados

## ESPIRITUALIDADE
- **Slots**: 1 × Tipo 1 (sistema) + 2 × Tipo 2 (entidades)
- **Layout**: Linha 1: full, Linhas 2-3: 2 quadrados

## PROPÓSITO
- **Slots**: 1 × Tipo 1 (missão) + 5 × Tipo 3 (traits)
- **Layout**: Linha 1: full, Linhas 2-4: 5 retângulos finos

## PROJETOS
- **Slots**: 6 × Tipo 2 (projetos + inspirações)
- **Layout**: Grid 2×3 de quadrados

## CONEXÕES
- **Slots**: 6 × Tipo 2 (conexões)
- **Layout**: Grid 2×3 de quadrados

## TRABALHO
- **Slots**: 2 × Tipo 3 (classes) + 1 × Tipo 1 (proficiências) + 1 × Tipo 1 (experiências)
- **Layout**: Linha 1: 2 finos, Linha 2: full, Linha 3: full

## FINANÇAS
- **Slots**: 2 × Tipo 3 (renda/gasto) + 1 × Tipo 1 (patrimônio) + 3 × Tipo 3 (ativos)
- **Layout**: Linha 1: 2 finos, Linha 2: full, Linha 3-4: 3 finos

## HOBBIES
- **Slots**: 6 × Tipo 2 (hobbies)
- **Layout**: Grid 2×3 de quadrados

## FÍSICO
- **Slots**: 4 × Tipo 3 (dados) + 1 × Tipo 1 (forma física)
- **Layout**: Linha 1: 4 finos, Linha 2: full

---

# 🚀 BENEFÍCIOS

✅ **Código reduzido**: ~70% menos CSS duplicado  
✅ **Manutenibilidade**: Mudar em um lugar, afeta todos  
✅ **Consistência**: Todos slots iguais visualmente  
✅ **Performance**: Menos CSS para carregar  
✅ **Escalabilidade**: Fácil adicionar novos slots  

---

# 🔄 MIGRAÇÃO

## Fase 1: Criar classes base
## Fase 2: Aplicar classes existentes
## Fase 3: Remover CSS duplicado
## Fase 4: Testar todos os ativos

---

💡 **ESTE DOCUMENTO SERÁ A BÍBLIA DOS SLOTS!**
