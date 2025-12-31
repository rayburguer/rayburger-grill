-- ==========================================
-- FASE 3: BLINDAJE DE SERVIDOR (HARDENING)
-- ==========================================
-- Ejecutar este script en el SQL Editor de Supabase.

-- 1. CONSTRAINTS (Restricciones de Integridad)
-- Evitan que entren datos inválidos o corruptos.

-- Tabla RB_USERS
ALTER TABLE rb_users
    ADD CONSTRAINT points_non_negative CHECK (points >= 0),
    ADD CONSTRAINT wallet_non_negative CHECK (wallet_balance_usd >= 0);

-- Asegurar unicidad de teléfono (si no existe ya)
-- Nota: Supabase Auth gestiona emails, pero si rb_users es nuestra tabla espejo:
ALTER TABLE rb_users
    ADD CONSTRAINT unique_phone_number UNIQUE (phone);


-- Tabla RB_PRODUCTS
ALTER TABLE rb_products
    ADD CONSTRAINT price_positive CHECK ("basePrice_usd" >= 0);


-- 2. TRIGGER FUNCTIONS (Lógica Automática)

-- Función para calcular Nivel de Lealtad automáticamente
CREATE OR REPLACE FUNCTION public.calculate_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica idéntica al helper de TypeScript
    IF NEW.points >= 5000 THEN
        NEW.loyalty_tier := 'Diamond';
    ELSIF NEW.points >= 1000 THEN
        NEW.loyalty_tier := 'Gold';
    ELSIF NEW.points >= 300 THEN
        NEW.loyalty_tier := 'Silver';
    ELSE
        NEW.loyalty_tier := 'Bronze';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función antes de guardar cambios en Puntos
DROP TRIGGER IF EXISTS tr_loyalty_tier ON rb_users;
CREATE TRIGGER tr_loyalty_tier
    BEFORE INSERT OR UPDATE OF points
    ON rb_users
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_loyalty_tier();

-- ==========================================
-- VERIFICACIÓN (Opcional - Solo para pruebas)
-- ==========================================
/*
-- Intento fallido (debería dar error)
UPDATE rb_users SET points = -50 WHERE id = 'some-id';

-- Intento exitoso (debería actualizar tier automáticamente)
UPDATE rb_users SET points = 1500 WHERE id = 'some-id';
-- Verificar: SELECT loyalty_tier FROM rb_users WHERE id = 'some-id'; -- Debería ser 'Gold'
*/
