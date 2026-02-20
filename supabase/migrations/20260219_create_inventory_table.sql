
-- Create user_inventory table
CREATE TABLE IF NOT EXISTS public.user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id TEXT NOT NULL,
    instance_id TEXT DEFAULT gen_random_uuid(),
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_equipped BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inventory"
    ON public.user_inventory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own inventory"
    ON public.user_inventory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
    ON public.user_inventory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own inventory"
    ON public.user_inventory FOR DELETE
    USING (auth.uid() = user_id);

-- Ensure user_profiles has wallet columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS wallet JSONB DEFAULT '{"gold": 0, "fragments": 0}'::jsonb;

-- Create RPC for buying gold packs
CREATE OR REPLACE FUNCTION buy_gold_pack(p_pack_id TEXT, p_amount_gold INTEGER, p_cost_brl NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_gold INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Get current gold
    SELECT COALESCE((wallet->>'gold')::INTEGER, 0) INTO v_current_gold
    FROM public.user_profiles
    WHERE id = v_user_id;
    
    -- Update wallet
    UPDATE public.user_profiles
    SET wallet = jsonb_set(
        COALESCE(wallet, '{"gold": 0, "fragments": 0}'::jsonb),
        '{gold}',
        to_jsonb(v_current_gold + p_amount_gold)
    )
    WHERE id = v_user_id;
    
    -- Log transaction (optional, create table if needed)
    -- INSERT INTO purchase_history ...
    
    RETURN jsonb_build_object('success', true, 'new_gold', v_current_gold + p_amount_gold);
END;
$$;

-- Create RPC for buying store items
CREATE OR REPLACE FUNCTION buy_store_item(p_item_id TEXT, p_cost_gold INTEGER, p_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_gold INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Get current gold
    SELECT COALESCE((wallet->>'gold')::INTEGER, 0) INTO v_current_gold
    FROM public.user_profiles
    WHERE id = v_user_id;
    
    IF v_current_gold < p_cost_gold THEN
        RAISE EXCEPTION 'Insufficient gold';
    END IF;
    
    -- Deduct gold
    UPDATE public.user_profiles
    SET wallet = jsonb_set(
        wallet,
        '{gold}',
        to_jsonb(v_current_gold - p_cost_gold)
    )
    WHERE id = v_user_id;
    
    -- Add item to inventory if it's an item
    IF p_type IN ('exclusive', 'codex') THEN
        -- Check if already owns (optional, depends on item type)
        INSERT INTO public.user_inventory (user_id, item_id)
        VALUES (v_user_id, p_item_id);
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Create RPC for crafting items
CREATE OR REPLACE FUNCTION craft_item(p_tier INTEGER, p_category TEXT, p_exact_item_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_fragments INTEGER;
    v_cost INTEGER;
    v_new_item_id TEXT;
    v_instance_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Determine cost
    v_cost := CASE p_tier
        WHEN 1 THEN 40
        WHEN 2 THEN 120
        WHEN 3 THEN 400
        WHEN 4 THEN 1200
        WHEN 5 THEN 4000
        ELSE 999999
    END;
    
    -- Get fragments
    SELECT COALESCE((wallet->>'fragments')::INTEGER, 0) INTO v_current_fragments
    FROM public.user_profiles
    WHERE id = v_user_id;
    
    IF v_current_fragments < v_cost THEN
        RAISE EXCEPTION 'Insufficient fragments';
    END IF;
    
    -- Deduct fragments
    UPDATE public.user_profiles
    SET wallet = jsonb_set(
        wallet,
        '{fragments}',
        to_jsonb(v_current_fragments - v_cost)
    )
    WHERE id = v_user_id;
    
    -- Determine item ID (simplified logic, normally would pick from pool)
    v_new_item_id := COALESCE(p_exact_item_id, 'item_random_' || floor(random() * 1000)::text);
    v_instance_id := gen_random_uuid();
    
    INSERT INTO public.user_inventory (id, user_id, item_id, instance_id)
    VALUES (v_instance_id, v_user_id, v_new_item_id, v_instance_id::text);
    
    RETURN jsonb_build_object('success', true, 'item_id', v_new_item_id, 'instance_id', v_instance_id);
END;
$$;

-- Create RPC for recycling items
CREATE OR REPLACE FUNCTION recycle_item(p_item_instance_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_item_id TEXT;
    v_tier INTEGER;
    v_fragments_gain INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Get item info and verify ownership
    SELECT item_id INTO v_item_id
    FROM public.user_inventory
    WHERE instance_id = p_item_instance_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found or not owned';
    END IF;
    
    -- Determine tier (mock logic, ideally check items table)
    -- Assuming tier 1 for now if not found in DB lookup
    v_tier := 1; 
    v_fragments_gain := 10; -- Base value
    
    -- Delete item
    DELETE FROM public.user_inventory
    WHERE instance_id = p_item_instance_id AND user_id = v_user_id;
    
    -- Add fragments
    UPDATE public.user_profiles
    SET wallet = jsonb_set(
        COALESCE(wallet, '{"gold": 0, "fragments": 0}'::jsonb),
        '{fragments}',
        to_jsonb(COALESCE((wallet->>'fragments')::INTEGER, 0) + v_fragments_gain)
    )
    WHERE id = v_user_id;
    
    RETURN jsonb_build_object('success', true, 'fragments_gained', v_fragments_gain);
END;
$$;
