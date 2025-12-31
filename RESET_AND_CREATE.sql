-- 🔥 COMPLETE DATABASE RESET & RECREATION
-- This script will DROP existing tables and recreate them with the correct schema

-- 1. DROP EXISTING TABLES (if they exist)
DROP TABLE IF EXISTS public.rb_orders CASCADE;
DROP TABLE IF EXISTS public.rb_users CASCADE;

-- 2. Create Users Table (snake_case)
CREATE TABLE public.rb_users (
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
    points INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'Bronze',
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'deleted')),
    registration_date BIGINT,
    registered_via TEXT DEFAULT 'web',
    birth_date TEXT,
    last_spin_date BIGINT,
    last_survey_date BIGINT,
    next_purchase_multiplier INTEGER DEFAULT 1,
    orders JSONB DEFAULT '[]'::jsonb,
    referral_stats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Orders Table (snake_case)
CREATE TABLE public.rb_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.rb_users(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE,
    total_usd NUMERIC(10,2) NOT NULL,
    items JSONB NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'approved', 'rejected')),
    customer_name TEXT,
    customer_phone TEXT,
    balance_used_usd NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Indexes for Performance
CREATE INDEX idx_users_phone ON public.rb_users(phone);
CREATE INDEX idx_users_email ON public.rb_users(email);
CREATE INDEX idx_users_referral_code ON public.rb_users(referral_code);
CREATE INDEX idx_orders_user_id ON public.rb_orders(user_id);
CREATE INDEX idx_orders_status ON public.rb_orders(status);

-- 5. Enable Row Level Security
ALTER TABLE public.rb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rb_orders ENABLE ROW LEVEL SECURITY;

-- 6. Temporary Permissive Policies (For Development)
CREATE POLICY "temp_allow_all_users" ON public.rb_users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temp_allow_all_orders" ON public.rb_orders
    FOR ALL USING (true) WITH CHECK (true);

-- Success!
DO $$
BEGIN
    RAISE NOTICE '✅ Database reset complete!';
    RAISE NOTICE '📊 Tables created: rb_users, rb_orders';
    RAISE NOTICE '🔑 All columns use snake_case';
END $$;
