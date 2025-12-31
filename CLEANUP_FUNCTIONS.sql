-- 🛡️ LIMPIEZA DE FUNCIONES RAY BURGER (Evitar sobrecarga / overloading)

-- 1. Eliminar versiones anteriores de rpc_process_order (con menos parámetros)
DROP FUNCTION IF EXISTS public.rpc_process_order(UUID, NUMERIC, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.rpc_process_order(UUID, NUMERIC, JSONB, TEXT, TEXT, TEXT, NUMERIC);

-- 2. Eliminar rpc_register_user si tiene firmas antiguas
DROP FUNCTION IF EXISTS public.rpc_register_user(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.rpc_register_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 3. Otras funciones de lealtad que deben ser migradas
DROP FUNCTION IF EXISTS public.process_wallet_payment(UUID, NUMERIC);

-- 4. Asegurar que las nuevas se creen limpias
-- [Aquí iría el contenido de PHASE_1_BACKEND.sql o ejecutarlo después]
