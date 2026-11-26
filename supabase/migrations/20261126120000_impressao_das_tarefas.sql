-- A IMPRESSAO DIGITAL DAS TAREFAS, DIA A DIA (26/11/2026) — egress de abertura.
--
-- O laudo de 26/11 mediu a abertura em ~495 KB, crescendo toda semana. Na conta
-- do Afonso, 247 KB eram as tarefas dos ultimos 3 meses (709 linhas), baixadas
-- inteiras a cada abertura, embora o passado quase nunca mude.
--
-- Os 3 meses nao podem sair do app: campanhas "da vida toda", pactos, missoes
-- da temporada e o comparador de ciclos contam essas tarefas. Entao o celular
-- guarda a parte antiga (mais de 14 dias atras) e, ao abrir, pede so isto: uma
-- impressao por dia. Baixa de novo apenas o dia que mudou, apareceu ou sumiu.
--
-- A impressao cobre todas as colunas que o app le (COLUNAS_DA_TAREFA), e o id:
-- tarefa criada, apagada, concluida ou editada muda a do seu dia.
--
-- Mesma comparacao da consulta antiga: `date` e texto e o filtro e por texto.
-- security invoker + o filtro por auth.uid(): so le as proprias tarefas.
--
-- Pode ser rodado de novo sem estrago. Sem ele, o app baixa como antes.

create or replace function public.impressoes_das_tarefas(p_de text, p_ate text)
returns table (dia text, impressao text)
language sql
stable
security invoker
set search_path = public
as $$
  select s.date,
         md5(string_agg(
           -- row(...)::text marca nulo e aspa texto: sem colisao entre colunas.
           row(s.id, s.action_id, s.start_time, s.duration, s.completed,
               s.completed_at, s.created_at, s.execution_order, s.instance_note,
               s.reminder_enabled, s.reminder_minutes)::text,
           '|' order by s.id))
  from public.scheduled_tasks s
  where s.user_id = auth.uid()
    and s.date >= p_de
    and s.date < p_ate
  group by s.date
  order by s.date
$$;

revoke all on function public.impressoes_das_tarefas(text, text) from public, anon;
grant execute on function public.impressoes_das_tarefas(text, text) to authenticated;

notify pgrst, 'reload schema';
