
-- Função para incrementar progresso de forma segura
create or replace function increment_clan_mission_progress(p_clan_id uuid, p_mission_id text, p_increment int)
returns void as $$
begin
  insert into public.clan_mission_progress (clan_id, mission_id, current_value, target_value)
  values (p_clan_id, p_mission_id, p_increment, 50)
  on conflict (clan_id, mission_id)
  do update set 
    current_value = clan_mission_progress.current_value + p_increment,
    last_updated = now();
end;
$$ language plpgsql security definer;
