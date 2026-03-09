<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16hnjyElorZDXLIeKqq_q73O47uxamNly

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_MERCADO_PAGO_PUBLIC_KEY` in [.env.local](.env.local). Optionally set `VITE_DISABLE_GOLD_INVITE=true` to bypass the Golden Invite gate for testing.
3. Run the app:
   `npm run dev`

---

## Sistema A FORJA e GM Board

Este projeto inclui o ecossistema "A FORJA" para economia, crafting e inventario.

### 1. Database & Migrations
Execute o script SQL em `supabase/migrations/20260219_forge_system.sql` no seu Supabase para criar as tabelas necessarias:
- `items`
- `user_inventory`
- `user_currency`
- `transaction_log`

### 2. GM Board (Painel Admin)
Para editar a economia do jogo (precos, drop rates, loot tables), acesse:
`http://localhost:3000/gmboard.html`

Este painel permite:
- Visualizar e editar o JSON de configuracao da economia.
- Simular abertura de baus com as loot tables atuais.
- Exportar o arquivo `economy.json`.

### 3. Configuracao de Economia
O arquivo base de economia esta em `constants/economy.ts`.
Para alterar valores em producao, atualize este arquivo ou implemente um fetch dinamico do `economy.json` gerado pelo GM Board.

### 4. Funcionalidades Implementadas
- **Loja de Ouro**: Compra de pacotes e Premium.
- **A Forja**: Crafting (T1-T5) e Reciclagem de itens.
- **Inventario**: Gestao de itens e equipamento (Skins, Glifos, Auras).
- **Biblioteca**: Sistema de Codexes (Legado + Novo).

For gateway.ts, use OPENROUTER_API_KEY in your shell environment (never hardcode keys).
