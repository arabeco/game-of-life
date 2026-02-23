
-- Function to handle clan mission progress updates atomically
CREATE OR REPLACE FUNCTION public.update_clan_mission_progress(
    p_mission_id UUID,
    p_increment INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_clan_id UUID;
    v_new_contribution INTEGER;
    v_total_progress INTEGER;
    v_mission_type TEXT;
    v_target_value INTEGER;
    v_is_completed BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    -- Get mission details
    SELECT clan_id, mission_type, target_value INTO v_clan_id, v_mission_type, v_target_value
    FROM public.clan_custom_quests
    WHERE id = p_mission_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mission not found');
    END IF;

    -- Update participant contribution
    UPDATE public.clan_mission_participants
    SET contribution_value = COALESCE(contribution_value, 0) + p_increment
    WHERE mission_id = p_mission_id AND user_id = v_user_id
    RETURNING contribution_value INTO v_new_contribution;
    
    IF NOT FOUND THEN
        -- If not participating, insert participation (auto-join for shared missions if not joined yet?)
        -- For now, assume participation exists via opt-in
        RETURN jsonb_build_object('success', false, 'error', 'User is not a participant');
    END IF;

    -- Calculate total progress
    IF v_mission_type = 'shared' THEN
        SELECT COALESCE(SUM(contribution_value), 0) INTO v_total_progress
        FROM public.clan_mission_participants
        WHERE mission_id = p_mission_id;
    ELSE
        -- For singular, progress is just the user's contribution
        v_total_progress := v_new_contribution;
    END IF;

    -- Check completion
    v_is_completed := v_total_progress >= v_target_value;

    -- Update mission status and value
    UPDATE public.clan_custom_quests
    SET 
        current_value = v_total_progress,
        status = CASE WHEN v_is_completed THEN 'completed' ELSE status END
    WHERE id = p_mission_id;

    RETURN jsonb_build_object(
        'success', true, 
        'new_contribution', v_new_contribution, 
        'total_progress', v_total_progress,
        'is_completed', v_is_completed
    );
END;
$$;
