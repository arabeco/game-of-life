# 🎯 15 TÓPICOS DE MELHORIAS MAIS DISCUTIDOS

Baseado nas conversas e arquivos de documentação do projeto.

---

## 1. **GRID DE SLOTS PADRONIZADO (6x8)**
**Recorrência: ALTA** 🔴
- Padronizar grid 6 colunas x 8 linhas para TODOS os ativos
- 3 tipos fixos: Tipo1 (retângulo largo, span 6), Tipo2 (mini retângulo, span 3), Tipo3 (quadrado, span 2)
- Configuração via JSON (`slot_layouts.json`) ao invés de CSS manual
- Alinhamento central e distribuição consistente
- **Status**: Planejado mas não totalmente implementado

---

## 2. **SISTEMA DE PROTOCOLOS/RELATÓRIOS DE PROGRESSO**
**Recorrência: ALTA** 🔴
- `generateProtocol()` - Geração de relatórios
- `calculateProtocolStats()` - Cálculo de estatísticas
- `openProtocolSlideshow()` - Slideshow de períodos
- `drawSpiderChart()` - Gráfico de teia dos ativos
- `drawSummaryChart()` - Gráfico de resumo
- **Problema**: `initProtocols()` pode não estar sendo chamado em `initApp()`
- **Status**: Implementado mas precisa verificação

---

## 3. **PLAYER SUMMARY CARD E RENDERSOCIAL()**
**Recorrência: ALTA** 🔴
- HTML do `player-summary-card` existe mas não é populado
- `renderSocial()` não atualiza elementos: `player-summary-nick`, `player-summary-level`, `player-summary-mood`, `player-summary-guild`, `player-summary-avatar`, `player-summary-banner`, `player-summary-border`
- **Status**: HTML pronto, JavaScript desconectado

---

## 4. **SISTEMA DE AMIGOS E NPCs - EVENT LISTENERS**
**Recorrência: ALTA** 🔴
- Botões `add-friend-btn` e `view-npcs-btn` não têm event listeners
- Funções existem (`getFriendList()`, `saveFriendList()`, `renderFriends()`) mas não estão conectadas
- **Status**: Código existe, falta conectar UI

---

## 5. **FUNÇÕES FALTANDO DO SUPABASE**
**Recorrência: MÉDIA** 🟡
- `getBannerUrl()` - Buscar banner do Supabase
- `getBorderUrl()` - Buscar border do Supabase
- `resolveMoodLabel()` - Converter humor numérico para label
- **Status**: Não implementadas

---

## 6. **SINCRONIZAÇÃO REATIVA DE ARENAS**
**Recorrência: MÉDIA** 🟡
- Quando pílula é concluída no Planner, porcentagem da Arena deve atualizar IMEDIATAMENTE
- Atualização deve ser reativa e global
- **Status**: Pode estar funcionando, mas precisa validação

---

## 7. **ESTILOS CSS INCOMPLETOS**
**Recorrência: MÉDIA** 🟡
- Estilos do `.player-summary-card` podem estar incompletos
- Estilos dos botões `.gold-button` e `.silver-button` precisam verificação
- Estilos dos modais de amigos/NPCs podem faltar
- Estilos dos protocolos precisam validação
- **Status**: Parcialmente implementado

---

## 8. **LAYOUT E ALINHAMENTO DE SLOTS**
**Recorrência: MÉDIA** 🟡
- Slots precisam alinhamento central consistente
- Distribuição por linha/coluna dentro do grid 6x8
- Remover CSS específico por asset que conflita com grid
- **Status**: Em progresso

---

## 9. **REMOÇÃO DE TÍTULOS DAS ABAS**
**Recorrência: BAIXA** 🟢
- Títulos das abas devem ser removidos
- Navegação mais limpa
- **Status**: Foi revertido, precisa reimplementar

---

## 10. **NAVEGAÇÃO FIXA SOBREPOSTA**
**Recorrência: BAIXA** 🟢
- Navegação inferior deve ser fixa e sobreposta
- Remover scrollbars das telas principais
- **Status**: Foi revertido, precisa reimplementar

---

## 11. **WHEELPICK PARA SELEÇÃO DE ATIVOS**
**Recorrência: BAIXA** 🟢
- Implementar wheelpick para seleção de ativos em modais
- Melhor UX que dropdowns
- **Status**: Foi revertido, precisa reimplementar

---

## 12. **SLIDERS E CHECKBOXES DE CONFIGURAÇÃO**
**Recorrência: BAIXA** 🟢
- Sliders de duração/frequência para ações bronze
- Checkboxes de dias da semana mais visuais
- **Status**: Foi revertido, precisa reimplementar

---

## 13. **CARDS DE CRIAR ARENA/AÇÃO REDESENHADOS**
**Recorrência: BAIXA** 🟢
- Cards de criação precisam redesign
- Melhor UX para criação de arenas e ações bronze
- **Status**: Foi revertido, precisa reimplementar

---

## 14. **PROTOCOLO DE HIATO**
**Recorrência: BAIXA** 🟢
- Verificar data do último login
- Se > 3 dias, limpar pílulas pendentes e desativar brilho das esferas
- **Status**: Pode estar implementado, precisa validação

---

## 15. **ESTÉTICA E DESIGN TOKENS**
**Recorrência: BAIXA** 🟢
- Manter Dark Mode absoluto (#000000)
- Cores Neon apenas para feedback
- Design High-Tech/Cyberpunk (não amigável/corporativo)
- Glassmorphism (transparência 0.05, blur 10px)
- **Nota**: Estética "Ouro e Luxo" foi revertida (usuário disse que estava "muito ruim")
- **Status**: Regras definidas, implementação variável

---

## 📊 RESUMO POR PRIORIDADE

### 🔴 **PRIORIDADE ALTA** (Implementar/Corrigir):
1. Grid de slots padronizado (6x8)
2. Sistema de protocolos (verificar initProtocols)
3. Player summary card (conectar renderSocial)
4. Event listeners de amigos/NPCs
5. Funções faltando do Supabase

### 🟡 **PRIORIDADE MÉDIA** (Verificar/Validar):
6. Sincronização reativa de arenas
7. Estilos CSS incompletos
8. Layout e alinhamento de slots

### 🟢 **PRIORIDADE BAIXA** (Melhorias de UX):
9. Remoção de títulos das abas
10. Navegação fixa sobreposta
11. Wheelpick para seleção
12. Sliders e checkboxes
13. Cards redesenhados
14. Protocolo de hiato
15. Estética e design tokens

---

## 🔄 TÓPICOS QUE FORAM REVERTIDOS

Vários tópicos foram implementados mas depois revertidos:
- Estética "Ouro e Luxo" (neomorfismo metálico)
- Remoção de títulos das abas
- Navegação fixa sobreposta
- Wheelpick, sliders, checkboxes melhorados
- Cards redesenhados

**Motivo**: Usuário disse que estava "muito ruim" ou foram perdidos na restauração do git.

---

**Última atualização**: Baseado em análise de MUDANCAS_IMPLEMENTADAS.md, VERIFICAR_CSS.md, .cursorrules.md e planos do Cursor
