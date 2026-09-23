-- O SLOT NAO ESTAVA ESCONDIDO DA TELA. ELE NAO EXISTIA.
--
-- `_relationship_build_capacity_summary` devolvia, para todas as capacidades:
--
--     'used', v_usado, 'limit', greatest(v_usado, 1),
--     'base', 0, 'purchased', 0, 'unlimited', true
--
-- O limite era um numero de enfeite: sempre igual ao que ja tinha sido usado.
-- Ninguem nunca era barrado, `purchased` era zero fixo, e o `costGold` de 50
-- nunca se aplicava. Do outro lado, `buyRelationshipCapacitySlot` no aplicativo
-- so mostrava um toast e devolvia false.
--
-- Entao nao havia o que mostrar numa tela, e e por isso que nao dava para
-- entender a regra olhando o app: nao havia regra.
--
-- A REGRA, EM UMA FRASE: uma arena viva por vinculo. Concluiu, libera. Quer
-- duas ao mesmo tempo, compra o espaco.
--
-- Isso muda uma coisa alem do limite: arena CONCLUIDA para de ocupar. A conta
-- antiga somava `relationship_link_arenas` sem olhar `completed_at`, entao uma
-- arena terminada em maio seguiria segurando o lugar — cobrar aluguel de coisa
-- acabada.
--
-- As outras quatro capacidades continuam sem limite, de proposito. Elas nunca
-- limitaram nada, e apertar agora tiraria de quem ja esta usando. O que este
-- arquivo faz e transformar UMA capacidade de enfeite em regra; o resto segue
-- declarado como o que e.

begin;

-- --------------------------------------------------------------------------
-- 1. A CAPACIDADE PASSA A CONTAR ALGUMA COISA.
-- --------------------------------------------------------------------------

create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_partnership   integer := 0;
  v_competition   integer := 0;
  v_mentor        integer := 0;
  v_pupil_mentor  integer := 0;
  v_arenas_vivas  integer := 0;
  v_vinculos      integer := 0;
  v_comprados     integer := 0;
begin
  if not exists (select 1 from public.user_profiles where id = p_user_id) then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select count(*) into v_partnership
  from public.relationship_links
  where link_type = 'parceria' and ended_at is null
    and (mentor_id = p_user_id or pupil_id = p_user_id);

  select count(*) into v_competition
  from public.relationship_links
  where link_type = 'competicao' and ended_at is null
    and (mentor_id = p_user_id or pupil_id = p_user_id);

  select count(*) into v_mentor
  from public.relationship_links
  where link_type = 'mentoria' and ended_at is null and mentor_id = p_user_id;

  select count(*) into v_pupil_mentor
  from public.relationship_links
  where link_type = 'mentoria' and ended_at is null and pupil_id = p_user_id;

  -- Quantos vinculos ativos: cada um da direito a UMA arena viva.
  select count(*) into v_vinculos
  from public.relationship_links
  where ended_at is null
    and (mentor_id = p_user_id or pupil_id = p_user_id);

  -- Arena CONCLUIDA nao ocupa. Ela virou historico, e o par continua vendo o
  -- carimbo de conclusao — segurar o lugar com ela seria cobrar aluguel de
  -- coisa acabada.
  select count(*) into v_arenas_vivas
  from public.relationship_link_arenas rla
  join public.relationship_links rl on rl.id = rla.relationship_link_id
  where rl.ended_at is null
    and rla.completed_at is null
    and (rl.mentor_id = p_user_id or rl.pupil_id = p_user_id);

  select coalesce(linked_arena_slots_purchased, 0) into v_comprados
  from public.user_profiles where id = p_user_id;

  return jsonb_build_object(
    'partnership', jsonb_build_object(
      'used', v_partnership, 'limit', greatest(v_partnership, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    ),
    'competition', jsonb_build_object(
      'used', v_competition, 'limit', greatest(v_competition, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    ),
    'mentor', jsonb_build_object(
      'used', v_mentor, 'limit', greatest(v_mentor, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    ),
    'linked_arena', jsonb_build_object(
      'used', v_arenas_vivas,
      -- Um por vinculo, mais o que foi comprado. Sem vinculo nenhum o limite e
      -- zero, e esta certo: nao ha com quem compartilhar.
      'limit', v_vinculos + v_comprados,
      'base', v_vinculos,
      'purchased', v_comprados,
      'costGold', 50,
      'requiresPremium', false,
      'unlimited', false
    ),
    'pupil_mentor', jsonb_build_object(
      'used', v_pupil_mentor, 'limit', greatest(v_pupil_mentor, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    )
  );
end;
$function$;

-- --------------------------------------------------------------------------
-- 2. A COMPRA PASSA A COMPRAR.
-- --------------------------------------------------------------------------
--
-- Preco no servidor, pelo mesmo motivo da loja: quem paga nao escolhe quanto.
-- Debito e concessao na mesma transacao — se o incremento falhasse depois do
-- debito, a pessoa pagaria por um espaco que nao ganhou.

create or replace function public.buy_relationship_capacity_slot(p_slot_type text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user       uuid := auth.uid();
  v_preco      integer := 50;
  v_novo_saldo integer;
  v_comprados  integer;
begin
  if v_user is null then
    raise exception 'sem sessao';
  end if;

  -- So a arena vinculada tem limite. Vender espaco para uma capacidade que ja
  -- e ilimitada seria cobrar por nada.
  if p_slot_type is distinct from 'linked_arena' then
    raise exception 'este espaco nao se compra';
  end if;

  update public.user_profiles
     set wallet = jsonb_set(
           coalesce(wallet, '{}'::jsonb),
           '{gold}',
           to_jsonb(coalesce((wallet->>'gold')::integer, 0) - v_preco)),
         linked_arena_slots_purchased = coalesce(linked_arena_slots_purchased, 0) + 1
   where id = v_user
     and coalesce((wallet->>'gold')::integer, 0) >= v_preco
  returning coalesce((wallet->>'gold')::integer, 0), coalesce(linked_arena_slots_purchased, 0)
       into v_novo_saldo, v_comprados;

  if not found then
    raise exception 'Insufficient gold';
  end if;

  return jsonb_build_object(
    'success', true,
    'charged', v_preco,
    'new_gold', v_novo_saldo,
    'purchased', v_comprados,
    'summary', public._relationship_build_capacity_summary(v_user)
  );
end;
$function$;

revoke all on function public.buy_relationship_capacity_slot(text) from public, anon;
grant execute on function public.buy_relationship_capacity_slot(text) to authenticated;

-- --------------------------------------------------------------------------
-- 3. O CONTADOR DE ESPACOS COMPRADOS SAI DA MAO DE QUEM COMPRA.
-- --------------------------------------------------------------------------
--
-- Ele so ficou gravavel ate aqui porque nao havia caminho de servidor para
-- concede-lo. Agora ha, e escrever o proprio numero de espacos pagos seria a
-- mesma coisa que escrever o proprio saldo.

revoke update (linked_arena_slots_purchased) on table public.user_profiles from authenticated;

commit;
