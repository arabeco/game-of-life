-- A anotacao "visitar dada" que sumiu de sexta e voltou no domingo (15/11/2026).
-- So leitura. Conta: mister x (e76e2b7f-...).

-- 1) A linha que tem a anotacao. Se created_at for de sexta (ou antes) e a data
--    hoje for domingo, e a MESMA ocorrencia que andou de dia, nao uma copia.
select t.id, a.name as acao, t.date, t.start_time, t.completed, t.completed_at,
       t.created_at, t.execution_order, t.instance_note
from scheduled_tasks t
join actions a on a.id::text = t.action_id::text
where t.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
  and t.instance_note ilike '%dada%';

-- 2) Todas as Conexao da semana, em ordem de criacao: mostra qual era a de sexta,
--    quais ficaram na espera (start_time = -1, nao concluida) e o que foi para domingo.
select t.id, a.name as acao, t.date, t.start_time, t.completed, t.completed_at,
       t.created_at, t.instance_note
from scheduled_tasks t
join actions a on a.id::text = t.action_id::text
where t.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
  and a.name ilike 'conex%'
  and t.date between '2026-11-09' and '2026-11-16'
order by t.created_at;
