-- TUDO QUE O CICLO ENXERGA, SEM FILTRO DE NOME NEM DE BAIA.
--
-- A consulta anterior escondeu as tarefas da missao porque filtrava
-- `completed or start_time >= 0`, e e exatamente isso que tira a baia. Aqui
-- nada e filtrado: cada arena aparece com o que esta no dia e o que espera.
--
-- `scopedTasks` em AssetsView NAO filtra start_time, entao a baia entra no
-- denominador do ciclo — ao contrario do painel diario, que a exclui de
-- proposito. Mesma pergunta, duas respostas, em duas telas.
select
  coalesce(ar.name, '(sem arena)')                                   as arena,
  count(*)                                                           as total,
  count(*) filter (where tk.completed)                               as concluidas,
  count(*) filter (where not tk.completed and tk.start_time >= 0)    as no_dia_por_fazer,
  count(*) filter (where not tk.completed and tk.start_time < 0)     as na_baia
from public.scheduled_tasks tk
join public.cycles c on c.id = '5c25f196-0835-4761-86be-d4a6b0923713'
 and tk.date between c.start_date::text and c.end_date::text
join public.actions a on a.id::text = tk.action_id::text
left join public.arenas ar on ar.id::text = a.arena_id::text
where tk.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
group by ar.name
order by total desc;
