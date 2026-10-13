-- NICKNAMES REPETIDOS (12/10/2026). So leitura.
-- Antes de travar o nome unico (sem diferenciar maiuscula/minuscula e espacos
-- nas pontas), ver quem ja colide hoje. Vazio = pode travar direto.
select lower(trim(nickname)) as nome, count(*) as contas,
       string_agg(id::text || ' (' || coalesce(nickname, '') || ')', ', ' order by created_at) as quem
from public.user_profiles
where nullif(trim(nickname), '') is not null
group by lower(trim(nickname))
having count(*) > 1
order by count(*) desc, nome;
