# GLYPH.MD - O CÓDIGO SOBERANO (AUDITORIA & ESTRATÉGIA)

> **Versão:** 1.0.6 (Soberano)  
> **Data:** 22/02/2026  
> **Status:** PRONTO PARA ESCALA (Marco 1)

---

## 1. RESUMO EXECUTIVO (A VISÃO DO TRONO)

O **Project Glyph** (GOL) deixou de ser um MVP. A arquitetura atual, fundamentada em React + Supabase, atingiu um nível de maturidade que permite a entrada de usuários reais. O sistema de autenticação, persistência de dados e lógica de gamificação (Soberania) estão operacionais.

Diferente de concorrentes que focam apenas na lista de tarefas (Todoist) ou apenas no RPG (Habitica), o Glyph encontrou seu "Oceano Azul": **A Gestão da Vida como um Império**. Não somos um app de produtividade; somos um **Sistema Operacional de Legado**.

A integração com Supabase está profunda, cobrindo desde o inventário do jogador até o chat via IA do Oráculo. O sistema de Notificações, recém-implementado, fecha o ciclo de retenção.

---

## 2. AUDITORIA DE FUNCIONALIDADES (O RAIO-X)

Abaixo, a análise técnica detalhada de cada módulo, verificando integridade com Supabase, consistência e experiência.

| Módulo | Status | Supabase | Observações & Melhorias Futuras |
| :--- | :---: | :---: | :--- |
| **AUTENTICAÇÃO & PERFIL** | 🟢 | ✅ `user_profiles` | Sincronia perfeita. **Melhoria:** Unificar `unlockedItems` (legado) com a nova tabela `user_inventory` para limpar o JSON do perfil. |
| **SEPHIROT (Ativos)** | 🟢 | ✅ `assets` | Core do sistema. Funciona bem. **Melhoria:** Adicionar "templates" de Sephirot para onboarding mais rápido (ex: Atleta, Estudante). |
| **ARENAS & AÇÕES** | 🟢 | ✅ `arenas`, `actions` | CRUD completo. Drag & Drop no Planner é fluido. **Melhoria:** Permitir "Ações Recorrentes Complexas" (ex: toda 3ª quinta-feira). |
| **PLANNER (Agenda)** | 🟡 | ✅ `scheduled_tasks` | Funcional, mas a UI de "Semana" precisa de mais densidade. **Comparativo:** O GCal vence em visualização rápida; precisamos de uma "Week View" mais compacta. |
| **ORÁCULO (IA)** | 🟢 | ✅ `oracle_messages` | **Estado da Arte.** Integração com Gemini + Histórico no Supabase + Notificações. É o nosso diferencial "Notion AI" com personalidade. |
| **SOCIAL (Clãs)** | 🟡 | ✅ `clans`, `members` | Funcionalidade base ok. **Crítico:** Falta um chat em tempo real dentro do Clã (usar Supabase Realtime) para engajamento diário. |
| **SANTUÁRIO (Jardim)** | 🟡 | ✅ `sanctuary_positions` | A ideia é genial, mas depende 100% de *Realtime* para não parecer estático. Precisa de polimento visual (WebGL/Canvas) no futuro. |
| **LOJA & ECONOMIA** | 🟢 | ✅ `inventory`, `wallet` | Compra, venda e equipar itens funcionam. A economia de "Fragmentos" vs "Ouro" está balanceada. |
| **NOTIFICAÇÕES** | 🟢 | ✅ `notifications` | Backend robusto implementado. Frontend integrado ao Oráculo. **Próximo passo:** Push Notifications reais (OneSignal ou Firebase). |
| **SEASON & MISSÕES** | 🟢 | ✅ `seasons` | Sistema de Battle Pass funcional. Ótimo para retenção (LTV). |

---

## 3. COMPARATIVO DE MERCADO (POR QUE SOMOS FODAS)

### VS. HABITICA ⚔️
*   **Eles:** Estética 8-bit, infantil, foco em RPG clássico. Código legado difícil de escalar.
*   **Nós:** Estética "High Fantasy/Soberano", moderna, UI de vidro (Glassmorphism). Foco em construção de império, não apenas "matar monstros".
*   **Veredito:** O Glyph é o Habitica para adultos que querem poder, não apenas diversão.

### VS. NOTION 📝
*   **Eles:** Tela em branco. Flexibilidade infinita, mas exige configuração exaustiva. "Paralisia da escolha".
*   **Nós:** Estrutura opinativa (Sephirot -> Arenas -> Ações). O usuário entra e já sabe o que fazer.
*   **Veredito:** O Glyph remove a fricção de configuração. É "Plug & Conquer".

### VS. GOOGLE CALENDAR 📅
*   **Eles:** Utilitário, frio, sem alma. Apenas "o que" e "quando".
*   **Nós:** Adicionamos o "PORQUÊ" (Briefing, Propósito). Cada ação gera XP e legado.
*   **Veredito:** O GCal gerencia tempo; o Glyph gerencia **Glória**.

---

## 4. AS 7 MÉTRICAS DE PODER (BARRA DE STATUS)

Avaliação técnica e de produto do estado atual (v1.0.6).

**1. ESTABILIDADE (Codebase)**
`[████████░░] 80%`
*O código está tipado (TypeScript), sem erros críticos de console. Tratamento de erros no SupabaseService está sólido.*

**2. PERFORMANCE (Render)**
`[███████░░░] 70%`
*React puro é rápido, mas listas longas (Chat/Logs) precisarão de virtualização/paginação em breve.*

**3. ESCALABILIDADE (Backend)**
`[█████████░] 90%`
*Supabase aguenta o tranco. RLS (Row Level Security) protege os dados. Estrutura pronta para milhares de usuários.*

**4. UX/UI (Experiência)**
`[██████████] 100%`
*A estética Glassmorphism + Animações é o ponto forte. É visualmente superior a qualquer concorrente direto.*

**5. ENGAJAMENTO (Loop)**
`[████████░░] 80%`
*Oráculo + XP + Loot Box (Baús) criam um loop viciante. Falta apenas o "social em tempo real" para fechar o 100%.*

**6. INTEGRIDADE (Dados)**
`[█████████░] 90%`
*Sincronia online/offline e persistência estão boas. O risco de perda de dados é mínimo com a arquitetura atual.*

**7. INOVAÇÃO (Diferencial)**
`[██████████] 100%`
*O conceito de "Soberania", "Sephirot" e "Oráculo com Personalidade" é único no mercado.*

---

## 5. RECOMENDAÇÕES ESTRATÉGICAS (O MAPA DA GUERRA)

Para atingirmos o **Marco 2 (A Expansão Territorial)**, foque nestes 3 pontos:

1.  **Limpeza de Legado:** Migrar completamente o `unlockedItems` do JSON do perfil para a tabela `user_inventory`. Isso facilitará queries de analytics no futuro.
2.  **Social Realtime:** Implementar `Supabase Realtime` no chat do Clã e na movimentação do Santuário. Ver outros jogadores se movendo cria o efeito de "mundo vivo" (MMO feeling).
3.  **Push Notifications:** O sistema interno está pronto. Agora precisamos conectar com um serviço de Push (OneSignal) para trazer o usuário de volta ao app quando ele não estiver usando.

---

> *"O código é a lei. A interface é o trono. O usuário é o Soberano."*
