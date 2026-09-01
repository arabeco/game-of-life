-- CHECAGEM — só lê, não altera nada.
--
-- A migração errou, então alguma suposição minha não corresponde ao que está no
-- banco. Ela assumia três coisas: que as duas assinaturas se chamam exatamente
-- `text` e `uuid`, que dá para derrubar uma delas com o usuário do editor, e que
-- os corpos poderiam ser comparados. Este arquivo confere as três em vez de
-- confiar em qualquer uma.
--
-- Espere 3 linhas: uma por versão de `recycle_item`, e um RESUMO no fim.
-- Me mande as três, e junto o texto exato do erro que a migração deu.

select
  format('%s. recycle_item(%s)',
         row_number() over (order by pg_get_function_identity_arguments(p.oid)),
         pg_get_function_identity_arguments(p.oid)) as qual,

  -- `identity` é o nome que um DROP precisa usar. Se ele não for literalmente
  -- "text" e "uuid", meu `drop function public.recycle_item(text)` não acha a
  -- função e falha — e essa é a primeira hipótese para o erro.
  format('identity=[%s] · dono=%s · %s · %s · vc=%s%s',
         pg_get_function_identity_arguments(p.oid),
         pg_get_userbyid(p.proowner),
         case p.prosecdef when true then 'security definer' else 'security invoker' end,
         coalesce(array_to_string(p.proconfig, ', '), 'sem search_path fixo'),
         current_user,
         case when pg_get_userbyid(p.proowner) = current_user
              then ' (vc e o dono, pode derrubar)'
              else ' (VC NAO E O DONO — DROP vai ser negado)' end) as ficha,

  p.prosrc as corpo

from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'recycle_item'

union all

select
  'RESUMO',
  format('%s versao(oes) · corpos %s · assinaturas: %s',
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'recycle_item'),
    -- Se forem iguais, a que sobra é escolha livre e a correção é derrubar uma.
    -- Se forem diferentes, uma delas já substituiu a outra e a escolha muda.
    coalesce((
      select case when count(distinct regexp_replace(p.prosrc, '\s+', '', 'g')) = 1
                  then 'IGUAIS (dá para derrubar qualquer uma)'
                  else 'DIFERENTES (a escolha importa)' end
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'recycle_item'
    ), '—'),
    coalesce((
      select string_agg(format('[%s]', pg_get_function_identity_arguments(p.oid)), ' e ' order by pg_get_function_identity_arguments(p.oid))
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'recycle_item'
    ), '—')),
  ''

order by 1;
