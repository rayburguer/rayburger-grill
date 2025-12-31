-- 🛡️ RAY BURGER PRO: MASTER BACKEND SETUP
-- Ejecutar este script en el SQL Editor de Supabase para limpiar versiones antiguas y activar el flujo profesional.

-- 1. LIMPIEZA DE FUNCIONES ANTERIORES (Evitar conflictos de parámetros)
DROP FUNCTION IF EXISTS public.rpc_process_order(UUID, NUMERIC, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.rpc_process_order(UUID, NUMERIC, JSONB, TEXT, TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.rpc_register_user(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_register_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. RE-APLICAR SCHEMA DE ÓRDENES (Garantizar columnas necesarias)
ALTER TABLE public.rb_orders ADD COLUMN IF NOT EXISTS multiplier_used NUMERIC(3,1) DEFAULT 1.0;
ALTER TABLE public.rb_orders ADD COLUMN IF NOT EXISTS rewards_granted BOOLEAN DEFAULT FALSE;

-- 3. REGISTRO SEGURO (Con Huella Digital)
CREATE OR REPLACE FUNCTION rpc_register_user(
    p_phone TEXT,
    p_name TEXT,
    p_password_hash TEXT,
    p_email TEXT,
    p_referral_code TEXT DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    existing_user RECORD;
    new_user_id UUID;
    v_bonus_amount NUMERIC := 0.50;
    v_bonus_points INT := 50;
BEGIN
    SELECT id INTO existing_user FROM rb_users WHERE phone = p_phone OR email = p_email LIMIT 1;
    IF FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'User already exists'); END IF;

    IF p_fingerprint IS NOT NULL THEN
        SELECT id INTO existing_user FROM rb_users WHERE fingerprint = p_fingerprint LIMIT 1;
        IF FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Device already registered'); END IF;
    END IF;

    INSERT INTO rb_users (name, phone, email, password_hash, wallet_balance_usd, points, registration_date, referral_code, referred_by_code, fingerprint, role, loyalty_tier)
    VALUES (p_name, p_phone, p_email, p_password_hash, v_bonus_amount, v_bonus_points, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT, 'RB-' || upper(substring(md5(random()::text) from 0 for 7)), p_referral_code, p_fingerprint, 'customer', 'Bronze')
    RETURNING id INTO new_user_id;

    INSERT INTO rb_system_logs (user_id, action, amount_usd, points_delta, metadata)
    VALUES (new_user_id, 'USER_REGISTERED', v_bonus_amount, v_bonus_points, jsonb_build_object('referral', p_referral_code));

    RETURN jsonb_build_object('success', true, 'data', new_user_id);
END;
$$;

-- 4. PROCESAMIENTO DE ÓRDEN (Diferido)
CREATE OR REPLACE FUNCTION rpc_process_order(
    p_user_id UUID,
    p_total_usd NUMERIC,
    p_items JSONB,
    p_payment_method TEXT,
    p_customer_name TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL,
    p_balance_used_usd NUMERIC DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user RECORD;
    v_multiplier NUMERIC := 1.0;
    v_new_order_id UUID := gen_random_uuid();
BEGIN
    SELECT * INTO v_user FROM rb_users WHERE id = p_user_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'User not found'); END IF;

    IF p_balance_used_usd > 0 THEN
        IF v_user.wallet_balance_usd < p_balance_used_usd THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance'); END IF;
        UPDATE rb_users SET wallet_balance_usd = wallet_balance_usd - p_balance_used_usd WHERE id = p_user_id;
        INSERT INTO rb_system_logs (user_id, action, amount_usd, metadata) VALUES (p_user_id, 'WALLET_DEDUCTION_PENDING', -p_balance_used_usd, jsonb_build_object('order_id', v_new_order_id));
    END IF;

    IF v_user.referred_by_code = 'FUNDADOR' AND ((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - v_user.registration_date) < (30::BIGINT * 24 * 60 * 60 * 1000) THEN
        v_multiplier := 3.0;
    END IF;

    INSERT INTO rb_orders (id, user_id, total_usd, items, payment_method, status, customer_name, customer_phone, balance_used_usd, multiplier_used, created_at)
    VALUES (v_new_order_id, p_user_id, p_total_usd, p_items, p_payment_method, 'pending', p_customer_name, p_customer_phone, p_balance_used_usd, v_multiplier, NOW());

    RETURN jsonb_build_object('success', true, 'order_id', v_new_order_id, 'multiplier_used', v_multiplier, 'points_potential', FLOOR(p_total_usd * v_multiplier));
END;
$$;

-- 5. APROBACIÓN (Entrega de Recompensas)
CREATE OR REPLACE FUNCTION rpc_approve_order(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
    v_user RECORD;
    v_referrer_id UUID;
    v_points_earned INT;
    v_referral_bonus NUMERIC;
BEGIN
    SELECT * INTO v_order FROM rb_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
    IF v_order.rewards_granted THEN RETURN jsonb_build_object('success', false, 'error', 'Rewards already granted'); END IF;

    v_points_earned := FLOOR(v_order.total_usd * v_order.multiplier_used);
    UPDATE rb_users SET points = points + v_points_earned, lifetime_spending_usd = lifetime_spending_usd + v_order.total_usd WHERE id = v_order.user_id;

    SELECT referred_by_code INTO v_user FROM rb_users WHERE id = v_order.user_id;
    IF v_user.referred_by_code IS NOT NULL AND v_user.referred_by_code != 'FUNDADOR' THEN
        SELECT id INTO v_referrer_id FROM rb_users WHERE referral_code = v_user.referred_by_code LIMIT 1;
        IF v_referrer_id IS NOT NULL THEN
            v_referral_bonus := v_order.total_usd * 0.02;
            UPDATE rb_users SET wallet_balance_usd = wallet_balance_usd + v_referral_bonus WHERE id = v_referrer_id;
            INSERT INTO rb_system_logs (user_id, action, amount_usd, metadata) VALUES (v_referrer_id, 'REFERRAL_COMMISSION', v_referral_bonus, jsonb_build_object('order_id', p_order_id));
        END IF;
    END IF;

    UPDATE rb_orders SET status = 'approved', rewards_granted = TRUE WHERE id = p_order_id;
    INSERT INTO rb_system_logs (user_id, action, points_delta, metadata) VALUES (v_order.user_id, 'POINTS_AWARDED', v_points_earned, jsonb_build_object('order_id', p_order_id));
    RETURN jsonb_build_object('success', true, 'points_earned', v_points_earned);
END;
$$;

-- 6. RECHAZO (Reembolso)
CREATE OR REPLACE FUNCTION rpc_reject_order(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM rb_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;
    IF v_order.status IN ('approved', 'rejected') THEN RETURN jsonb_build_object('success', false, 'error', 'Order already finalized'); END IF;

    IF v_order.balance_used_usd > 0 THEN
        UPDATE rb_users SET wallet_balance_usd = wallet_balance_usd + v_order.balance_used_usd WHERE id = v_order.user_id;
        INSERT INTO rb_system_logs (user_id, action, amount_usd, metadata) VALUES (v_order.user_id, 'WALLET_REFUND', v_order.balance_used_usd, jsonb_build_object('order_id', p_order_id));
    END IF;

    UPDATE rb_orders SET status = 'rejected' WHERE id = p_order_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
