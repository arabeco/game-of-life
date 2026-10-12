-- O PERFIL DA ABERTURA, SEM O JARDIM 2D (12/10/2026) — passo 2 do egress de abertura.
--
-- Na conta do Afonso o perfil eram 25 KB por abertura, e 19 deles eram
-- `garden_state`: os tracos do jardim 2D aposentado. Nada no app le nem grava
-- esse campo hoje (o jardim 3D vive no inventario), mas o `select *` o trazia em
-- toda abertura.
--
-- Esta funcao devolve a MESMA linha do `select *`, so sem `garden_state`. Coluna
-- nova que entrar na tabela vem junto sozinha — nao ha lista de colunas para
-- esquecer de atualizar. O dado continua guardado: so deixa de descer na
-- abertura.
--
-- Roda como quem chama (sem security definer): a regra de acesso da tabela vale
-- igual, e cada um so le o proprio perfil.
--
-- Pode ser rodado de novo sem estrago.

create or replace function public.meu_perfil_de_abertura()
returns jsonb
language sql
stable
set search_path = public
as $$
  select to_jsonb(p) - 'garden_state'
  from public.user_profiles p
  where p.id = auth.uid()
$$;

revoke all on function public.meu_perfil_de_abertura() from public, anon;
grant execute on function public.meu_perfil_de_abertura() to authenticated;

notify pgrst, 'reload schema';
