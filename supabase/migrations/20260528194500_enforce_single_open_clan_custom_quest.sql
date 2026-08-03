do $$
begin
  if to_regclass('public.clan_custom_quests') is not null then
    create or replace function public.enforce_single_open_clan_custom_quest()
    returns trigger
    language plpgsql
    as $function$
    begin
      if new.status in ('active', 'locked') and exists (
        select 1
        from public.clan_custom_quests existing
        where existing.clan_id = new.clan_id
          and existing.id is distinct from new.id
          and existing.status in ('active', 'locked')
      ) then
        raise exception 'Only one open clan mission is allowed per clan';
      end if;

      return new;
    end;
    $function$;

    drop trigger if exists enforce_single_open_clan_custom_quest_trigger on public.clan_custom_quests;

    create trigger enforce_single_open_clan_custom_quest_trigger
      before insert or update of clan_id, status
      on public.clan_custom_quests
      for each row
      execute function public.enforce_single_open_clan_custom_quest();
  end if;
end $$;
