-- NICKNAME UNICO (12/10/2026).
--
-- Um nome por pessoa no app, sem diferenciar maiuscula de minuscula nem
-- espacos nas pontas ("Mister X" e "  mister x " sao o mesmo). Ate 20
-- caracteres em nome novo ou trocado (nomes antigos maiores ficam).
--
--   * nickname_disponivel(nome): a tela do primeiro acesso pergunta enquanto a
--     pessoa digita e mostra o aviso vermelho;
--   * conta NOVA com nome repetido (o cadastro automatico usa o nome do Google)
--     ganha um numero no fim ("mister x 2"), para o cadastro nunca quebrar;
--   * TROCAR para um nome em uso e recusado (NICKNAME_EM_USO), e acima de 20
--     tambem (NICKNAME_LONGO).
--
-- Antes de rodar: supabase/CHECK-nicknames-repetidos.sql tem de vir vazio. Se
-- houver repetidos, este arquivo para com uma mensagem e nao muda nada.
--
-- Pode ser rodado de novo sem estrago.

begin;

do $$
begin
  if exists (
    select 1 from public.user_profiles
    where nullif(btrim(nickname), '') is not null
    group by lower(btrim(nickname)) having count(*) > 1
  ) then
    raise exception 'NICKNAMES_REPETIDOS: rode supabase/CHECK-nicknames-repetidos.sql e resolva antes';
  end if;
end;
$$;

create unique index if not exists user_profiles_nickname_unico
  on public.user_profiles (lower(btrim(nickname)))
  where nullif(btrim(nickname), '') is not null;

create or replace function public.nickname_disponivel(p_nome text)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select nullif(btrim(p_nome), '') is not null
     and not exists (
       select 1 from public.user_profiles up
       where lower(btrim(up.nickname)) = lower(btrim(p_nome))
         and up.id is distinct from auth.uid()
     )
$$;
revoke all on function public.nickname_disponivel(text) from public, anon;
grant execute on function public.nickname_disponivel(text) to authenticated;

create or replace function public._nickname_unico()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_base text;
  v_n integer := 2;
begin
  if nullif(btrim(new.nickname), '') is null then
    return new;
  end if;
  new.nickname := btrim(new.nickname);
  if tg_op = 'UPDATE' then
    if lower(new.nickname) is not distinct from lower(btrim(old.nickname)) then
      return new;
    end if;
    if char_length(new.nickname) > 20 then
      raise exception 'NICKNAME_LONGO';
    end if;
    if exists (select 1 from public.user_profiles where lower(btrim(nickname)) = lower(new.nickname) and id <> new.id) then
      raise exception 'NICKNAME_EM_USO';
    end if;
    return new;
  end if;
  -- INSERT: o cadastro nao pode quebrar; nome repetido ganha numero.
  v_base := left(new.nickname, 17);
  while exists (select 1 from public.user_profiles where lower(btrim(nickname)) = lower(new.nickname)) loop
    new.nickname := v_base || ' ' || v_n;
    v_n := v_n + 1;
  end loop;
  return new;
end;
$$;
revoke all on function public._nickname_unico() from public, anon, authenticated;
drop trigger if exists nickname_unico on public.user_profiles;
create trigger nickname_unico before insert or update of nickname on public.user_profiles
for each row execute function public._nickname_unico();

commit;
notify pgrst, 'reload schema';
