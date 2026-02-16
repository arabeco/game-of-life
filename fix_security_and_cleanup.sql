-- 1. SECURAR A TABELA REPORTS (CRÍTICO)
-- Atualmente está UNRESTRICTED, o que permite que qualquer usuário veja relatórios de outros.
alter table public.reports enable row level security;

create policy "Users can view their own reports"
on public.reports for select
using (auth.uid() = user_id);

create policy "Users can insert their own reports"
on public.reports for insert
with check (auth.uid() = user_id);

create policy "Users can update their own reports"
on public.reports for update
using (auth.uid() = user_id);

-- 2. SECURAR A TABELA CHECKLIST_ITEMS (PREVENÇÃO)
-- Mesmo que o código atual use LocalStorage, a tabela existe e está desprotegida.
alter table public.checklist_items enable row level security;

create policy "Users can view their own checklist items"
on public.checklist_items for select
using (auth.uid() = user_id);

create policy "Users can manage their own checklist items"
on public.checklist_items for all
using (auth.uid() = user_id);

-- 3. SECURAR A TABELA ASSETS (SE FOR USADA NO FUTURO)
-- Parece não utilizada pelo código atual (usa constantes), mas é bom travar.
alter table public.assets enable row level security;

-- Nenhuma policy de leitura pública por enquanto, a menos que seja dados estáticos do jogo.
-- Se for apenas config do sistema, apenas admins deveriam tocar.
