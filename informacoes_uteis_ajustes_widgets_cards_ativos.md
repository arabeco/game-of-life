# Informações Úteis para Ajustes de Widgets nos Cards de Ativos

## Prompt Mestre para o Cursor (Refeito e Otimizado)

### Instrução Crítica para Layout de Ativos

Refaça a renderização dos slots de ativos no `tree-edit-modal` seguindo rigorosamente estas regras de **Grid de 6 Colunas**. Não altere o `styles.css` global, use as classes já existentes ou adicione estilos inline via JS para garantir a precisão matemática abaixo:

---

## 1. Estrutura do Grid (6 Colunas Reais)

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

---

## 2. Definição Rígida dos 3 Tipos de Slots

### Tipo 1 (rect-wide)
- `grid-column: span 6;` (Ocupa a largura total da árvore)

### Tipo 2 (rect)
- `grid-column: span 3;` (Sempre dois por linha, simétricos)

### Tipo 3 (square-2)
- `grid-column: span 2;`
- `grid-row: span 3;`
- `aspect-ratio: 1/1;` (Sempre três por linha, formando um bloco quadrado perfeito)

---

## 3. Hierarquia de Seções (Injeção de Títulos)

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

---

## 4. Configuração por Ativo (Mapa de Layout)

### CONEXÃO
- Lema (Tipo 1) → Título "CRENÇAS" → 3 Crenças (Tipo 1 ou 2 conforme conteúdo)

### ESPIRITUALIDADE
- Título "SISTEMA" → Sistema (Tipo 1) → Título "SANTUÁRIO" → 3 Entidades (Tipo 3)

### MENTE
- Filosofia (Tipo 1) → Imagem (Tipo 1, altura dupla)

### TRABALHO
- 2 Classes (Tipo 2 cada) → Proficiências (Tipo 1 com `margin-top: -10px`) → Título "EXPERIÊNCIAS" → 3 Experiências (Tipo 1)

### FINANÇAS
- Renda/Gasto (Tipo 2 cada) → Patrimônio (Tipo 1) → Título "ATIVOS" → 3 Ativos (Tipo 2)

### AUTENTICIDADE
- Título "HOBBIES" → 6 Hobbies organizados em 2 linhas (Tipo 3 cada, 3 por linha)

### FISICO
- Idade/Gênero/Peso/Altura (Tipo 3 para cada um, totalizando 4 slots) → Forma Física (Tipo 1)

---

## 5. Alinhamento de Texto

- Todo `slot-label` e `slot-value` dentro desses modais deve ser `text-align: center;`
- Utilize `display: flex; align-items: center; justify-content: center;` em todos os slots

---

## Notas Importantes

- **Não altere o `styles.css` global** para essas regras específicas
- Use estilos inline via JavaScript ou classes específicas do modal
- Mantenha a precisão matemática do grid (6 colunas exatas)
- Garanta que os slots respeitem as proporções definidas
- Os títulos de seção devem sempre ocupar a largura total (`grid-column: 1 / -1`)
