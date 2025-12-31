-- 🛡️ AGREGAR COLUMNA DE SEGURIDAD (HUELLA DIGITAL)
ALTER TABLE public.rb_users ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- Crear un índice para búsquedas rápidas de fraude
CREATE INDEX IF NOT EXISTS idx_rb_users_fingerprint ON public.rb_users(fingerprint);
