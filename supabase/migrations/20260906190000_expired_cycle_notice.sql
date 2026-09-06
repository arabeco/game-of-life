-- O ciclo que venceu e ninguem viu.
--
-- POR QUE ISTO E O ITEM 14, E NAO "FECHAR O CICLO NO SERVIDOR":
--
-- Fechar um ciclo e 387 linhas no cliente — fair score, EXP, bau, insignias,
-- relatorio. Portar isso para ca criaria DUAS implementacoes da mesma nota, que
-- e o defeito mais caro que este app ja teve: duas verdades sobre o mesmo numero,
-- divergindo em silencio.
--
-- E nem e preciso. O cliente JA fecha sozinho: existe um efeito que detecta
-- `hoje > end_date`, chama `endCycle`, concede tudo e abre o relatorio. O que ele
-- nao consegue e acontecer sem ninguem abrir o app — e quem nao abre e
-- exatamente quem tem um ciclo vencido parado.
--
-- Entao o servidor faz a unica parte que e dele: PERCEBER e AVISAR. O fecho
-- continua com quem sabe fechar.
--
-- Um aviso por ciclo vencido, uma vez so. Se a pessoa nao abrir, ela nao e
-- lembrada de novo no dia seguinte — cobrar todo dia por algo parado e
-- exatamente o que este app decidiu nao fazer.
--
-- Aplicar inteiro no SQL Editor do projeto correto.
begin;

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
  if extract(hour from v_now_local) <> 20 then
    return 0;
  end if;

  with vencendo as (
    select distinct on (c.user_id)
      c.user_id,
      c.id::text as cycle_id,
      coalesce(nullif(trim(c.name), ''), 'seu ciclo') as cycle_name,
      (c.end_date::date - v_today) as days_left,
      -- A chave e por pessoa + data de fim + limiar. Dois ciclos que terminam no
      -- mesmo dia geram um aviso so; datas diferentes continuam gerando o seu.
      -- 'vencido' e um limiar unico: quantos dias faz nao muda a mensagem, e usar
      -- o numero faria o aviso se repetir todo dia.
      format(
        'cycle_deadline:%s:%s:%s',
        c.user_id::text,
        c.end_date::text,
        case when (c.end_date::date - v_today) < 0 then 'vencido' else (c.end_date::date - v_today)::text end
      ) as dispatch_key
    from public.cycles c
    left join public.oracle_preferences op
      on op.user_id = c.user_id
    where c.report_data is null
      and c.end_date is not null
      -- Tres momentos: faltam tres dias, e hoje, e ja venceu.
      and ((c.end_date::date - v_today) in (3, 0) or (c.end_date::date - v_today) < 0)
      and coalesce(op.notifications_enabled, true) = true
      and exists (
        select 1
        from public.push_subscriptions ps
        where ps.user_id = c.user_id
          and ps.disabled_at is null
      )
    -- O mais urgente fala: vencido antes de "e hoje", "e hoje" antes de "faltam 3".
    order by c.user_id, (c.end_date::date - v_today) asc, c.created_at desc
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
      -- Vencido: o relatorio nasce quando a pessoa abre, entao o texto promete
      -- exatamente isso — e nao "voce perdeu o prazo", que nao e verdade nem util.
      when v.days_left < 0 then format('O ciclo %s chegou ao fim. Abra o Glyph e o relatório dele te espera.', v.cycle_name)
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

commit;
