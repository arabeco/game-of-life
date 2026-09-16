-- ============================================================
-- POR QUE 16 PLANEJADO E 9 FEITO, SE SAO 11 E 2?
--
-- Sobre o "9": a culpa e da consulta anterior, nao do app. O app NAO conta toda
-- tarefa que ja existiu — getArenaPresentationTasks recorta as tarefas entre a
-- data de inicio do ciclo e hoje; sem ciclo aberto, corta no ultimo "zerar".
-- Minha consulta nao recortava nada e somou ciclo velho junto.
--
-- Sobre o "16": 5 + 5 + 1 = 11, entao ou ha acao a mais na arena, ou alguma tem
-- repetitions diferente do que voce lembra. A consulta A responde.
--
-- Arena: Academia e dieta = 6c416137-5f9d-4efa-a05c-a6416b8aeae2
-- Conta: misterxhermit    = e76e2b7f-a771-4738-a10a-30a993ecafeb
-- ============================================================


-- ============================================================
-- A) O QUE TEM DENTRO DA ARENA — explica o 16.
--
-- Some a coluna `conta_como` e compare com 16. Se aparecer uma quarta acao, ou
-- uma com repetitions maior do que voce lembra, achamos o excedente. Acao do
-- tipo 'Livre' nao entra na conta (a coluna diz isso na linha).
-- ============================================================
select
  ac.name,
  ac.action_type,
  ac.repetitions,
  case
    when coalesce(ac.action_type, '') = 'Livre' then 0
    else greatest(1, coalesce(ac.repetitions, 1))
  end as conta_como,
  ac.id
from public.actions ac
where ac.arena_id = '6c416137-5f9d-4efa-a05c-a6416b8aeae2'
order by ac.name;


-- ============================================================
-- B) SEUS CICLOS — qual e a janela que o app esta usando agora.
--
-- O ciclo aberto e o que ainda nao tem report_data. As datas dele sao o recorte
-- que o card da arena aplica.
-- ============================================================
select
  id,
  start_date,
  end_date,
  (report_data is not null) as fechado,
  created_at
from public.cycles
where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
order by start_date desc
limit 6;


-- ============================================================
-- C) TODA TAREFA CONCLUIDA DESSA ARENA, COM A DATA — explica o 9.
--
-- Esta e a consulta que responde "o zerar pegou?":
--
--  - Se as linhas com data DENTRO do ciclo aberto (ver B) forem so as 2 que
--    voce fez, entao o app esta certo, o zerar funcionou, e o 9 era so a minha
--    consulta somando ciclo antigo.
--
--  - Se aparecerem linhas concluidas com data dentro do ciclo atual que voce
--    NAO fez, ai sim ha bug: o zerar deixou tarefa concluida para tras.
-- ============================================================
select
  st.date,
  ac.name as acao,
  st.completed,
  st.id as task_id
from public.scheduled_tasks st
join public.actions ac on ac.id::text = st.action_id
where ac.arena_id = '6c416137-5f9d-4efa-a05c-a6416b8aeae2'
  and st.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
  and coalesce(st.completed, false) = true
order by st.date desc;


-- ============================================================
-- D) O MESMO NUMERO QUE O APP MOSTRA — recortado pelo ciclo aberto.
--
-- Se D bater com o que voce ve na tela, a conta do app esta coerente e o
-- assunto vira apenas "quais acoes existem na arena" (consulta A).
--
-- Se D voltar tudo zero, e porque NAO ha ciclo aberto (B mostra todos fechados).
-- Nesse caso o app usa o outro recorte, o do ultimo "zerar", e a resposta esta
-- na consulta C: contam so as tarefas depois daquela data.
-- ============================================================
with ciclo as (
  select start_date, end_date
  from public.cycles
  where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
    and report_data is null
  order by start_date desc
  limit 1
),
por_acao as (
  select
    ac.id,
    ac.name,
    greatest(1, coalesce(ac.repetitions, 1)) as planejado,
    (
      select count(*)
      from public.scheduled_tasks st, ciclo c
      where st.action_id = ac.id::text
        and st.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
        and coalesce(st.completed, false) = true
        and st.date::text >= c.start_date::text
        and st.date::text <= least(c.end_date::text, to_char(now(), 'YYYY-MM-DD'))
    ) as feito_no_ciclo
  from public.actions ac
  where ac.arena_id = '6c416137-5f9d-4efa-a05c-a6416b8aeae2'
    and coalesce(ac.action_type, '') <> 'Livre'
)
select
  name as acao,
  planejado,
  feito_no_ciclo
from por_acao
union all
select
  'TOTAL',
  sum(planejado),
  sum(feito_no_ciclo)
from por_acao;
