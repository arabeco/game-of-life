-- UMA TORNEIRA DE BAU ABERTA PARA A INTERNET.
--
-- A funcao inteira era isto:
--
--   CREATE FUNCTION public.grant_chest(p_user_id uuid, p_chest_type text)
--   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
--   BEGIN
--     INSERT INTO user_chests (user_id, chest_type) VALUES (p_user_id, p_chest_type);
--   END;
--   $$
--
-- Quatro problemas de uma vez:
--
--   1. Nao olha quem chamou. O destino e um PARAMETRO, entao se da bau para
--      qualquer conta — nao so para a propria.
--   2. Nao valida o tipo. Qualquer texto entra em `user_chests`, e depois o app
--      nao sabe desenhar a linha que ele mesmo criou.
--   3. SECURITY DEFINER sem `search_path`. Roda como o dono e resolve
--      `user_chests` pelo caminho de quem chama.
--   4. EXECUTE liberado para PUBLIC e anon. Sem conta, sem login: basta a URL
--      do projeto, que vive no bundle do cliente.
--
-- Juntando: qualquer pessoa na internet inseria bau lendario em qualquer id.
--
-- O QUE ISTO CONSERTA, E O QUE NAO CONSERTA.
--
-- Conserta o acesso ANONIMO e o bau para OUTRA conta. Nao conserta o dono da
-- conta se dando bau: o app ainda e quem decide quando um bau foi ganho, e
-- isso vale para quase toda a economia interna — esta registrado no cabecalho
-- da migracao de 14/09. Fechar aquilo pede que cada premio passe a ser
-- decidido no servidor, que e obra de outro tamanho. Esta aqui e a parte que
-- nao precisa esperar por ela.
--
-- A FUNCAO ANTIGA NAO MORRE, e de proposito: `_competition_grant_chest` paga
-- bau para OUTRAS pessoas (o anuncio de patente do cla paga todos os membros),
-- e ela precisa de um caminho que aceite um id. Esse caminho passa a ser so do
-- servidor: SECURITY DEFINER roda como o dono, que mantem o EXECUTE, entao as
-- chamadas internas seguem funcionando sem nenhuma alteracao nelas.

begin;

-- ---------------------------------------------------------------------------
-- 1. A PORTA DO APP: so sabe uma conta, a de quem chamou.
-- ---------------------------------------------------------------------------

create or replace function public.grant_my_chest(p_chest_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- A lista e a de `ChestType` em types.ts. Tipo fora dela virava linha que o
  -- app nao sabe desenhar — e o erro so aparecia na tela do inventario, longe
  -- daqui.
  if p_chest_type is null or p_chest_type not in
    ('Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Season', 'Ciclo', 'Skin Comum') then
    raise exception 'invalid_chest_type: %', p_chest_type;
  end if;

  insert into public.user_chests (user_id, chest_type) values (v_user_id, p_chest_type);
end;
$$;

revoke all on function public.grant_my_chest(text) from public, anon;
grant execute on function public.grant_my_chest(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. A PORTA INTERNA: continua aceitando um id, mas so o servidor alcanca.
-- ---------------------------------------------------------------------------

create or replace function public.grant_chest(p_user_id uuid, p_chest_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'grant_chest: destino obrigatorio';
  end if;

  if p_chest_type is null or p_chest_type not in
    ('Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Season', 'Ciclo', 'Skin Comum') then
    raise exception 'invalid_chest_type: %', p_chest_type;
  end if;

  insert into public.user_chests (user_id, chest_type) values (p_user_id, p_chest_type);
end;
$$;

-- O ponto do arquivo. Quem nao e o servidor perde o caminho que aceita um id.
revoke all on function public.grant_chest(uuid, text) from public, anon, authenticated;

commit;
