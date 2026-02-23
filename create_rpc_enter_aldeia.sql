-- Cria uma função RPC segura para lidar com a entrada no slot de forma atômica
-- Isso contorna a complexidade de conflitos de RLS/Upsert do lado do cliente
CREATE OR REPLACE FUNCTION enter_aldeia_slot_v2(
  p_clan_id UUID,
  p_slot_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtém o ID do usuário atual de forma segura
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 1. Realiza Upsert Atômico
  -- Isso lida com "Verificar se existe" + "Inserir ou Atualizar" em uma única operação de banco de dados atômica
  INSERT INTO public.clan_aldeia_presence (clan_id, user_id, slot_id, started_at)
  VALUES (p_clan_id, v_user_id, p_slot_id, now())
  ON CONFLICT (clan_id, user_id)
  DO UPDATE SET 
    slot_id = EXCLUDED.slot_id,
    started_at = EXCLUDED.started_at;
    
  -- 2. Atualiza o horário da última visita do slot (para lógica de decaimento de saúde)
  UPDATE public.clan_aldeia_slots
  SET last_visited_at = now()
  WHERE clan_id = p_clan_id AND slot_id = p_slot_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concede permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION enter_aldeia_slot_v2(UUID, TEXT) TO authenticated;
