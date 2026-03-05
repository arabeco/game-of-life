-- Tabela para registrar as compras realizadas e evitar duplicidade (Payment ID do Mercado Pago)
CREATE TABLE IF NOT EXISTS user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    payment_id TEXT UNIQUE NOT NULL, -- UNIQUE para blindar contra duplicidade
    gold_amount INTEGER NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Função do Webhook para processar o pagamento aprovado
-- O Mercado Pago enviará uma notificação que chamará esta lógica via Edge Function ou Endpoint.

-- Lógica para somar o ouro na tabela user_profiles
CREATE OR REPLACE FUNCTION process_approved_payment(
    p_user_id UUID,
    p_payment_id TEXT,
    p_gold_amount INTEGER,
    p_amount_paid DECIMAL(10, 2),
    p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    v_new_gold INTEGER;
BEGIN
    -- 1. Verifica se a transação já foi processada (Payment ID UNIQUE cuida disso, mas fazemos check manual também)
    IF EXISTS (SELECT 1 FROM user_purchases WHERE payment_id = p_payment_id AND status = 'approved') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pagamento já processado');
    END IF;

    -- 2. Registra ou atualiza a compra
    INSERT INTO user_purchases (user_id, payment_id, gold_amount, amount_paid, status, metadata)
    VALUES (p_user_id, p_payment_id, p_gold_amount, p_amount_paid, 'approved', p_metadata)
    ON CONFLICT (payment_id) DO UPDATE 
    SET status = 'approved', updated_at = NOW();

    -- 3. Soma o ouro na carteira do usuário
    UPDATE user_profiles
    SET wallet = jsonb_set(
        COALESCE(wallet, '{"gold": 0, "fragments": 0}'::jsonb),
        '{gold}',
        (COALESCE((wallet->>'gold')::int, 0) + p_gold_amount)::text::jsonb
    )
    WHERE id = p_user_id
    RETURNING (wallet->>'gold')::int INTO v_new_gold;

    RETURN jsonb_build_object(
        'success', true, 
        'new_gold', v_new_gold,
        'message', 'Ouro creditado com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
