-- CHECAGEM — só lê, não altera nada.
--
-- `recycle_item` existe DUAS vezes, com o mesmo nome de argumento e tipos
-- diferentes: `(p_item_instance_id text)` e `(p_item_instance_id uuid)`.
--
-- É essa a falha do item 7. O app manda o argumento como string JSON, e os dois
-- candidatos aceitam string. O PostgREST não tem como escolher, então recusa a
-- chamada inteira (PGRST203) — e a recusa chegava na tela como "Falha na
-- sincronização de dados", porque naquela versão qualquer erro dizia isso.
--
-- `craft_item` tem uma assinatura só. Por isso Forjar não caiu no mesmo buraco.
--
-- Uma das duas tem de sair. Qual, depende do que cada uma faz — e é isso que
-- este arquivo mostra. Derrubar a errada troca um defeito por outro mais difícil
-- de ver, então vale a paciência de olhar antes.
--
-- Espere 2 linhas. Me mande as duas.

select
  format('%s(%s)', p.proname, pg_get_function_arguments(p.oid)) as assinatura,
  format('%s · %s · dono %s',
         case p.prosecdef when true then 'security definer' else 'security invoker' end,
         coalesce(array_to_string(p.proconfig, ', '), 'sem search_path fixo'),
         pg_get_userbyid(p.proowner)) as como_roda,
  -- O corpo inteiro. É o único jeito de comparar as duas de verdade: elas podem
  -- ser a mesma coisa escrita duas vezes, ou uma pode ser uma versão antiga que
  -- ficou para trás quando a outra foi criada.
  p.prosrc as corpo
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'recycle_item'
order by pg_get_function_arguments(p.oid);
