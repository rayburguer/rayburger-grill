-- 🏗️ RAY BURGER DATABASE SCHEMA (PROFESSIONAL VERSION)
-- Run this BEFORE Phase 1 Backend RPCs

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.rb_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    last_name TEXT,
    password_hash TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by_code TEXT,
    wallet_balance_usd NUMERIC(10,2) DEFAULT 0.00 CHECK (wallet_balance_usd >= 0),
    lifetime_spending_usd NUMERIC(10,2) DEFAULT 0.00,
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    loyalty_tier TEXT DEFAULT 'Bronze',
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'deleted')),
    registration_date BIGINT,
    registered_via TEXT DEFAULT 'web',
    birth_date TEXT,
    last_spin_date BIGINT,
    last_survey_date BIGINT,
    next_purchase_multiplier INTEGER DEFAULT 1,
    fingerprint TEXT, -- Security: Unique device ID
    orders JSONB DEFAULT '[]'::jsonb,
    referral_stats JSONB DEFAULT '{"totalReferred": 0, "referredThisMonth": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.rb_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.rb_users(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE,
    total_usd NUMERIC(10,2) NOT NULL CHECK (total_usd >= 0),
    items JSONB NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'approved', 'rejected')),
    customer_name TEXT,
    customer_phone TEXT,
    balance_used_usd NUMERIC(10,2) DEFAULT 0 CHECK (balance_used_usd >= 0),
    multiplier_used NUMERIC(3,1) DEFAULT 1.0, -- Points multiplier at time of order
    rewards_granted BOOLEAN DEFAULT FALSE,    -- Locked ground truth for points
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. [NEW] Table: System Logs (For auditing money/points)
CREATE TABLE IF NOT EXISTS public.rb_system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.rb_users(id),
    action TEXT NOT NULL, -- e.g., 'WALLET_DEDUCTION', 'POINTS_AWARDED'
    amount_usd NUMERIC(10,2),
    points_delta INTEGER,
    metadata JSONB, -- Details about the order or event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.rb_users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.rb_users(email);
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON public.rb_users(fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.rb_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.rb_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.rb_system_logs(user_id);

-- 5. Enable Row Level Security
ALTER TABLE public.rb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_system_logs ENABLE ROW LEVEL SECURITY;

-- 6. Initial Admin Policy (Temporary permissive for initial setup, but RLS is ON)
DROP POLICY IF EXISTS "allow_all_development" ON public.rb_users;
CREATE POLICY "allow_all_development" ON public.rb_users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_development" ON public.rb_orders;
CREATE POLICY "allow_all_development" ON public.rb_orders FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allow_all_development" ON public.rb_system_logs;
CREATE POLICY "allow_all_development" ON public.rb_system_logs FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
    RAISE NOTICE '✅ Professional Schema (Fortaleza) created successfully!';
END $$;
