-- O aviso de prazo do ciclo, gerado pelo SERVIDOR.
--
-- Por que isto existe: o ciclo ja mora no Postgres com data de fim, entao contar
-- quantos dias faltam e uma subtracao de datas. Ninguem precisa abrir o app para
-- essa conta acontecer — e justamente quem NAO abriu e que perde o prazo.
--
-- Duas mensagens por ciclo, no maximo: aos tres dias restantes e no ultimo dia.
-- A chave de despacho garante uma vez cada, mesmo com o cron rodando a cada
-- minuto e mesmo se a funcao for chamada duas vezes.
--
-- O QUE NAO DA PARA FAZER AINDA, e vale estar escrito:
--
--   1. "so para quem nao abriu o app hoje" — o unico sinal de presenca no banco e
--      `push_subscriptions.last_seen_at`, e ele e atualizado tanto na abertura do
--      app quanto na ENTREGA de um push. Um aviso atualizaria o sinal que decide
--      o proximo. Preferi nao usar um dado que mente a fingir precisao.
--
--   2. "faltam 3 dias e 11 acoes" — a contagem de pendencias exige percorrer
--      acoes x repeticoes x conclusoes por arena do ciclo, que e a mesma conta
--      pesada do fecho. Fica para quando ela for barata; o texto de agora diz so
--      o que da para afirmar sem inventar.
--
--   3. o tom por ritmo (adiantado x atrasado) depende da mesma conta acima.
--      Enquanto ela nao existe, o texto e NEUTRO — e melhor nao dizer nada sobre
--      o ritmo do que chutar e errar com quem esta indo bem.
--
-- Aplicar inteiro no SQL Editor do projeto correto.
begin;

-- A trava de "uma vez so", no mesmo molde do lembrete de acao.
create table if not exists public.cycle_deadline_dispatches (
  dispatch_key text primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  cycle_id text not null,
  days_left integer not null,
  created_at timestamptz not null default now()
);

create index if not exists cycle_deadline_dispatches_user_idx
  on public.cycle_deadline_dispatches (user_id, created_at desc);

alter table public.cycle_deadline_dispatches enable row level security;

-- Ninguem escreve nisto pelo cliente: quem preenche e a funcao, que roda como
-- security definer. A leitura fica com o dono, para depuracao.
drop policy if exists cycle_deadline_dispatches_select_own on public.cycle_deadline_dispatches;
create policy cycle_deadline_dispatches_select_own
  on public.cycle_deadline_dispatches for select
  using (auth.uid() = user_id);

create or replace function public.enqueue_cycle_deadline_notifications()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_now_local timestamp := timezone('America/Sao_Paulo', now());
  v_today date := (timezone('America/Sao_Paulo', now()) - interval '4 hours')::date;
  v_inserted integer := 0;
begin
  -- A JANELA DAS 20H.
  --
  -- O cron continua frequente porque ele e vazao, nao relogio: quem decide a
  -- hora e esta condicao. Uma hora inteira de janela para o disparo nao depender
  -- do minuto exato em que o cron acordou.
  if extract(hour from v_now_local) <> 20 then
    return 0;
  end if;

  with vencendo as (
    select
      c.user_id,
      c.id::text as cycle_id,
      coalesce(nullif(trim(c.name), ''), 'seu ciclo') as cycle_name,
      (c.end_date::date - v_today) as days_left,
      format('cycle_deadline:%s:%s', c.id::text, (c.end_date::date - v_today)) as dispatch_key
    from public.cycles c
    left join public.oracle_preferences op
      on op.user_id = c.user_id
    where c.report_data is null
      -- Ciclo ativo: o mesmo criterio que o app usa para achar o dele.
      and c.end_date is not null
      and (c.end_date::date - v_today) in (3, 0)
      and coalesce(op.notifications_enabled, true) = true
      and exists (
        select 1
        from public.push_subscriptions ps
        where ps.user_id = c.user_id
          and ps.disabled_at is null
      )
  ),
  reserved as (
    insert into public.cycle_deadline_dispatches (dispatch_key, user_id, cycle_id, days_left)
    select v.dispatch_key, v.user_id, v.cycle_id, v.days_left
    from vencendo v
    on conflict (dispatch_key) do nothing
    returning dispatch_key
  )
  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  select
    extensions.gen_random_uuid(),
    v.user_id,
    'cycle_deadline',
    case
      when v.days_left = 0 then format('Hoje é o último dia do ciclo %s.', v.cycle_name)
      else format('Faltam %s dias no ciclo %s.', v.days_left, v.cycle_name)
    end,
    false,
    now(),
    jsonb_build_object('cycleId', v.cycle_id, 'daysLeft', v.days_left)
  from vencendo v
  join reserved r on r.dispatch_key = v.dispatch_key;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.enqueue_cycle_deadline_notifications() from public;

-- O cron continua a cada dez minutos: ele e a bomba d'agua. Quem segura o
-- horario e a condicao das 20h dentro da funcao — assim a hora e do usuario, nao
-- do agendador, e mudar o horario nao exige mexer no cron.
do $$
begin
  perform cron.unschedule('glyph-cycle-deadline-notice');
exception when others then null;
end;
$$;

do $$
begin
  perform cron.schedule(
    'glyph-cycle-deadline-notice',
    '*/10 * * * *',
    $cron$
      select public.enqueue_cycle_deadline_notifications();
    $cron$
  );
exception
  when undefined_table then
    null;
end;
$$;

commit;
