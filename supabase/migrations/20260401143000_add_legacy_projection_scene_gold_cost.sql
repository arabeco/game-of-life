create or replace function public.buy_legacy_projection_scene()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_cost integer := 50;
  v_new_gold integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'legacy_projection_scene',
    'Geracao da cena do legado',
    jsonb_build_object(
      'cost_gold', v_cost,
      'surface', 'legacy_projection'
    )
  );

  return jsonb_build_object(
    'success', true,
    'cost_gold', v_cost,
    'new_gold', v_new_gold
  );
end;
$$;

revoke all on function public.buy_legacy_projection_scene() from public;
grant execute on function public.buy_legacy_projection_scene() to authenticated;
