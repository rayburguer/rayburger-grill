-- =================================================================
-- SCRIPT DE LIMPIEZA MÁS SEGURO (Versión 2)
-- BORRA: Ventas y Usuarios de prueba ANTERIORES al 25 de Dic 2025
-- PROTEGE: Al Admin principal y datos recientes
-- =================================================================

-- 1. BORRAR PEDIDOS DE PRUEBA
-- Usamos el timestamp numerico (milisegundos) usado por la App.
-- Fecha de corte: 25 Dic 2025 00:00 AM (~1766635200000 ms)
-- Nota: Si tu 'id' es texto (ej. "POS-123..."), no lo casteamos a int para evitar errores.
-- Nos basamos solo en la columna 'timestamp' (si existe) o 'created_at'.

DO $$
BEGIN
    -- Intentar borrar por columna 'timestamp' (prioridad) si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rb_orders' AND column_name = 'timestamp') THEN
        DELETE FROM rb_orders 
        WHERE CAST(timestamp AS BIGINT) < 1766635200000; 
    ELSE
        -- Fallback: Borrar por fecha de creación en base de datos
        DELETE FROM rb_orders 
        WHERE created_at < '2025-12-25 00:00:00-04';
    END IF;
END $$;


-- 2. BORRAR USUARIOS DE PRUEBA (Opcional pero recomendado)
-- Mantiene al Admin principal seguro.
DELETE FROM rb_users 
WHERE created_at < '2025-12-25 00:00:00-04'
AND email NOT IN ('raimundovivas17@gmail.com') -- 🛡️ PROTECCIÓN ADMIN
AND role != 'admin';

-- 3. RESULTADOS
SELECT count(*) as usuarios_restantes FROM rb_users;
SELECT count(*) as pedidos_restantes FROM rb_orders;
