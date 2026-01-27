# Documentação Geral: Game of Life (Life Gamification)

## 1. Identidade Visual & Design System

**Estilo:** Fusão de Glassmorphism (transparência, blur, bordas sutis) com Neo-Brutalismo (alto contraste, fontes limpas "Inter", bordas marcadas).

**Paleta de Luxo:** Fundo prateado gradiente escuro, detalhes em Dourado (Gold) para níveis e Bronze para ações comuns.

**Grid Mestre:** Todos os ativos e modais operam em um **Grid de 6 Colunas** com **largura máxima de 420px**.

---

## 2. Arquitetura dos 10 Ativos (Sephirot)

Cada ativo representa uma área da vida com **Nível (0-10)** definido no modo Oráculo/Sovereign.

### Estrutura do Card de Ativo

- **Cabeçalho:** Botão Editar (Esq), Título (Centro), Símbolo + Botão OK (Dir).
- **Corpo:** Box de "Maestria Atual" com **Círculo Dourado** exibindo o nível.
- **Rodapé:** Miniaturas de Arenas vinculadas + Botão "Adicionar Arena" (contorno pontilhado).

### Widgets de Ativo (Os 3 Tipos)

| Tipo | Nome | Grid | Uso |
|------|------|------|-----|
| **Tipo 1** | Rect-Wide | `grid-column: span 6` | Frases e títulos longos |
| **Tipo 2** | Rect | `grid-column: span 3` | Textos curtos ou Wheelpickers |
| **Tipo 3** | Square-2 | `grid-column: span 2; grid-row: span 3; aspect-ratio: 1/1` | Imagens com legenda |

---

## 3. Sistema de Arenas & Ações

As **Arenas** são sub-áreas dos Ativos onde o jogo acontece.

- **Miniaturas:** Exibidas lado a lado em "rows" por Ativo.
- **Criar/Editar Arena:** Card luxuoso em **gradiente prateado escuro**. Contém: Logo central, Título, Descrição da Meta, Slots de Ações de Bronze e Barra de Progresso Dourada.
- **Ações de Bronze (Task):** Card em **gradiente Bronze luxuoso**.
  - Atributos: Nome, Arena, Logo, Slider Duração (15min - 6h), Frequência (1-25x/semana), Checkboxes de Dias, Meta Temporal e Compromisso Sério.

---

## 4. O Planner (Core Loop)

- **Daypicker:** Navegação de datas no topo.
- **Checklist Básica:** Ícone de pastinha (hábitos diários como "escovar dentes"). Brilha ao completar; expira à meia-noite.
- **Relatórios:** Ícone de relógio para acesso rápido.
- **Mecânica de Arrastar:** Slots de Bronze são arrastados para o grid de horários. Segurar por 3 segundos completa a ação e gera progresso na Arena.
- **Visual Semanal:** Grid de 7 colunas com ícones simplificados.

---

## 5. Sistema Social & Perfil

- **Busca:** Campo de busca com botão OK.
- **Cards Sociais:** Lista horizontal (Avatar, Borda, Nick, Nível, Banner, Clã, Status Online).
- **Perfil Expandido:** Card customizável com skins. Avatar centralizado com nível abaixo do Nick. Exibe os widgets de ativos que o player escolheu mostrar.

---

## 6. Histórico & Relatórios (O Scan de Progresso)

Ao clicar em **"Novo Relatório"**, ocorre uma animação de **Scan** que gera **5 telas**:

1. **Rating:** Tempo analisado e cálculo de performance.
2. **Métricas:** Ações cumpridas, metas batidas e horas totais.
3. **Destaque:** Arena mais focada e ação mais repetida.
4. **Mapa de Teia:** Gráfico radial (radar chart) das 10 Sephirot.
5. **Resumo Final:** Card para compartilhamento.

---

## 7. Menu de Configurações & Progressão

- **Notificações:** Modos Coach, Focado, Relaxado e Silencioso.
- **Loja (EXP):** Troca de horas investidas e quests por Skins de interface.
- **Maestria:** Controle total do nível dos ativos via sliders (Modo Soberano).

---

## 🚀 Prompt de Execução para o Cursor Auto

> Auto, use a documentação acima como guia de referência para o projeto. Comece focando na **Refatoração dos Slots de Ativos** seguindo a regra de **6 colunas** e os **3 tipos de widgets**. Certifique-se de que a lógica de **'Ver Arena'** e **'Criar Ação'** siga os gradientes de **Prata** e **Bronze** descritos. O app.js deve ser limpo de lógicas antigas de títulos manuais, usando agora a **injeção automática de títulos** baseada no novo **Layout Mestre**.
