# Memória de versões antigas — Onde achar cada coisa

Busca nos backups e arquivos `*_restored`, `*_penultimo`, `*_antes_merge`, `temp_styles`.

---

## 1. **6 widgets lado a lado no editar (perfil)**

**O que procurar:** Na tela de perfil, ao editar, os **widgets** (slots escolhidos) em **6 colunas** lado a lado.

| Onde | O quê |
|------|--------|
| **temp_styles.css** | `#tree-edit-modal .slot-list` com **grid 6 col** (`repeat(6, 1fr)`), max-width 420px, slot-type-1 (span 6), tipo-2 (span 3), tipo-3 (span 2). Isto é no **modal de editar ativo** (tree-edit), não no perfil. |
| **temp_styles.css** / **styles_restored.css** | `.widget-display` com `repeat(auto-fit, minmax(140px, 1fr))` — widgets do **perfil** em grid fluido; em telas largas podem sair ~6 por linha, mas não é 6 fixo. |
| **styles.css atual** | `.widget-display` usa `repeat(2, minmax(0, 1fr))` — só 2 colunas. |

**Conclusão:**  
- **6 col no editar de ativos (tree-edit):** está em **temp_styles.css** (bloco “RESET ESTRUTURAL… grid 6 col”, slot-type-1/2/3).  
- **6 widgets lado a lado no editar do perfil:** não há versão com **6 colunas fixas** para `.widget-display`. O mais próximo é o `auto-fit` em **temp_styles** / **styles_restored** (que pode renderizar ~6 em telas grandes). Para ter 6 fixo, seria criar algo como `grid-template-columns: repeat(6, 1fr)` em `.widget-display`.

---

## 2. **Aba de perfil melhorada com cards mais bonitos**

**Onde está:** **temp_styles.css** e **styles_restored.css**.

| O quê | Onde (ex.) |
|-------|------------|
| **Profile-card** com temas | `data-card` (gold, silver, frost, white), `data-border` (halo, circuit, obsidian), gradientes `--profile-card-bg` / `--profile-card-border`. |
| **Modos** | `.profile-card.is-npc`, `.profile-card.is-external` — esconder edição, mostrar “Adicionar amigo” etc. |
| **Widget-display** | Slot-type-1/2/3, profile-slot estilizados (bordas douradas, fundo escuro). |
| **Widget-grid** | 5 colunas para escolher widgets. |

Trechos relevantes:  
- **temp_styles.css** ~ linhas 2624–2720 (`.widget-display`, `.widget-grid`), ~2820–3007 (`.profile-card`).  
- **styles_restored.css** ~ 2624–2720 (widgets), ~2820–3029 (profile-card).

**Conclusão:** A “aba de perfil melhorada com cards mais bonitos” está em **temp_styles.css** e **styles_restored.css**. Basta copiar/adaptar os blocos de `.profile-card`, `.widget-display` e `.widget-grid`.

---

## 3. **Relatório e geração de cards de relatório**

**Onde está:** **app_restored.js** (e **app_antes_merge.js**).

| Função / peça | O que faz |
|----------------|-----------|
| **renderHistoryReport(week, profile, reportWrap)** | Monta o **card de relatório**: `history-report-card` com header (avatar, nome, nível, período), grid de stats por ativo (barras de progresso, %), footer (score, botão “Baixar Relatório”). |
| **Baixar Relatório** | Usa `html2canvas` no `#history-report-card` e faz download PNG (`relatorio-semanal-{week.key}.png`). |
| **loadHistorySource()** | Carrega perfil + planner + arenas (local + Supabase). |
| **buildHistoryWeeks(planner, arenas)** | Constrói as semanas para histórico. |
| **renderHistoryView()** | Popula lista de semanas (`history-week-list` em app_restored; o HTML atual usa `planner-history-list`). |
| **renderPlannerHistoryDetail(week, modalDetailEl)** | Preenche o modal de detalhe com o relatório da semana (usa `renderHistoryReport`). |

Trechos:  
- **app_restored.js** ~ 6364–6514 (`loadHistorySource`, `renderHistoryReport`), ~6516–6565 (`renderHistoryView`), ~6710+ (uso de `planner-history-list` / detalhe).

No **app.js atual**, o botão de relatórios chama **openPlannerReports()**, mas essa função **não existe** no código. O fluxo completo (abrir modal, listar semanas, mostrar card, baixar) está só em **app_restored** / **app_antes_merge**.

**Conclusão:** A “geração de cards de relatório” e o “Baixar Relatório” estão em **app_restored.js**. É preciso trazer `renderHistoryReport`, `loadHistorySource`, `buildHistoryWeeks`, `renderHistoryView`, `renderPlannerHistoryDetail` e o wiring com `planner-history-list` / `planner-history-modal-detail`, e definir **openPlannerReports** para usar isso.

---

## 4. Resumo rápido

| O que queres | Onde buscar |
|--------------|-------------|
| **6 col no editar de ativos** (tree-edit slots) | **temp_styles.css** — `#tree-edit-modal .slot-list` + slot-type-1/2/3. |
| **6 widgets lado a lado no editar do perfil** | Não existe 6 fixo. Mais próximo: **temp_styles** / **styles_restored** `.widget-display` com `auto-fit`; para 6 fixo, adicionar `repeat(6, 1fr)` em `.widget-display`. |
| **Perfil com cards mais bonitos** | **temp_styles.css** e **styles_restored.css** — `.profile-card`, `data-card` / `data-border`, widgets. |
| **Relatório + cards de relatório + Baixar** | **app_restored.js** — `renderHistoryReport`, `loadHistorySource`, `buildHistoryWeeks`, `renderHistoryView`, detalhe + html2canvas. |

---

## 5. Arquivos de referência

- **app_restored.js** — relatórios, history-report-card, loadHistorySource, buildHistoryWeeks.  
- **app_antes_merge.js** — mesmo fluxo de relatórios.  
- **temp_styles.css** — grid 6 col (tree-edit), widget-display, profile-card.  
- **styles_restored.css** — widget-display, profile-card (mesma lógica que temp_styles).  
- **styles_penultimo.css** — variações de layout; menos completo que temp/restored.

**Nota:** `history-report-card`, `history-report-header`, `history-report-grid`, etc. não têm CSS no **styles.css** atual. Se usares **app_restored**, tens de garantir que os estilos dessas classes existem (ou copiá-los de algum backup de CSS que os tenha).
