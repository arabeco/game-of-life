-- DE ONDE VEM O 86, SENDO QUE SO HA 70 TAREFAS.
--
-- So le. A tela nao conta tarefas agendadas: ela soma as REPETICOES declaradas
-- em cada acao do ciclo, por `buildCycleActionTotal` em views/AssetsView.tsx:
--
--     Marco  -> 0
--     Livre  -> 1
--     resto  -> repetitions (minimo 1)
--     total  -> max(essa soma, numero de tarefas agendadas)
--
-- Entao uma acao marcada "3 repeticoes" conta 3 no denominador mesmo que
-- ninguem tenha posto nenhuma num dia. E dai que saem os 16 que faltam.
select
  count(*)                                                as acoes_no_ciclo,
  sum(case
        when a.action_type = 'Marco' then 0
        when a.action_type = 'Livre' then 1
        else greatest(1, coalesce(a.repetitions, 1))
      end)                                                as soma_das_repeticoes,
  sum(case when a.action_type not in ('Marco','Livre')
             and coalesce(a.repetitions, 1) > 1
           then greatest(1, coalesce(a.repetitions,1)) - 1 else 0 end) as repeticoes_alem_da_primeira
from public.actions a
join public.arenas ar on ar.id::text = a.arena_id::text
where ar.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb';
