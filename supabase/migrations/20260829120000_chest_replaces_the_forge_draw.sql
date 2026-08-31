begin;

-- O bau substitui o sorteio da forja.
--
-- A forja tinha duas formas de forjar: item exato e "sortear na categoria". As
-- duas custavam o MESMO, entao ninguem sortearia — escolher era estritamente
-- melhor, e a opcao aleatoria existia na tela sem nunca ter razao de ser usada.
--
-- Escolher exato foi para o modal do item, onde a vontade nasce: voce ve a
-- colecao, ve o que falta, e forja dali. O que sobrou do sorteio vira o que ele
-- sempre foi por dentro — um bau. E bau ja existe no jogo, com abertura, arte e
-- raridade proprias; ele so nunca tinha sido vendido.
--
-- PRECO: 60% do custo de forjar um item exato daquele patamar, que e o desconto
-- ja decidido para o aleatorio. Escala junto com o resto da economia em vez de
-- inventar uma tabela nova ao lado.
--
--     Comum      T1     24        (forjar exato: 40)
--     Incomum    T2     72        (120)
--     Raro       T3    240        (400)
--     Epico      T4    720        (1200)
--     Lendario   T5   2400        (4000)
--
-- Mitico fica de fora: ele e so de temporada e vive fora da escada normal, como
-- ja diz o comentario em ECONOMY.recycle_values. Season e Ciclo tambem nao se
-- compram — sao recompensa, e vender bau de recompensa esvaziaria o motivo de
-- receber um.
--
-- Por que RPC e nao desconto no cliente: o cliente pode mentir sobre quantos
-- fragmentos tem. Forjar e reciclar ja passam pelo servidor; comprar bau seria a
-- unica porta em que a carteira e conferida por quem gasta.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'CHEST_PURCHASE_MISSING: public.profiles';
  end if;
  if to_regproc('public.grant_chest(uuid, text)') is null then
    raise exception 'CHEST_PURCHASE_MISSING: public.grant_chest';
  end if;
end;
$$;

create or replace function public.buy_chest_with_fragments(p_chest_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_price integer;
  v_wallet jsonb;
  v_fragments integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- A tabela de precos mora AQUI, e nao chega por parametro: preco que vem do
  -- cliente e preco que o cliente escolhe.
  v_price := case p_chest_type
    when 'Comum' then 24
    when 'Incomum' then 72
    when 'Raro' then 240
    when 'Épico' then 720
    when 'Lendário' then 2400
    else null
  end;

  if v_price is null then
    raise exception 'CHEST_NOT_FOR_SALE';
  end if;

  select coalesce(wallet, '{}'::jsonb) into v_wallet
  from public.profiles
  where id = v_uid
  for update;

  v_fragments := coalesce((v_wallet->>'fragments')::integer, 0);

  if v_fragments < v_price then
    raise exception 'NOT_ENOUGH_FRAGMENTS';
  end if;

  update public.profiles
  set wallet = jsonb_set(v_wallet, '{fragments}', to_jsonb(v_fragments - v_price))
  where id = v_uid;

  -- Cobra primeiro, concede depois, na mesma transacao: se a concessao falhar, o
  -- desconto volta junto.
  perform public.grant_chest(v_uid, p_chest_type);

  return jsonb_build_object(
    'success', true,
    'chest_type', p_chest_type,
    'spent', v_price,
    'fragments_left', v_fragments - v_price
  );
end;
$fn$;

revoke all on function public.buy_chest_with_fragments(text) from public;
grant execute on function public.buy_chest_with_fragments(text) to authenticated;

commit;
