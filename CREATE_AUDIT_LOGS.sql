-- 🛡️ CREAR TABLA DE AUDITORÍA (NECESARIA PARA FINANZAS)
CREATE TABLE IF NOT EXISTS public.rb_system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.rb_users(id),
    action TEXT NOT NULL, -- e.g., 'WALLET_DEDUCTION', 'POINTS_AWARDED'
    amount_usd NUMERIC(10,2),
    points_delta INTEGER,
    metadata JSONB, -- Detalles del evento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para auditorías rápidas
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.rb_system_logs(user_id);

-- Habilitar seguridad
ALTER TABLE public.rb_system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_development" ON public.rb_system_logs;
CREATE POLICY "allow_all_development" ON public.rb_system_logs FOR ALL USING (true) WITH CHECK (true);
