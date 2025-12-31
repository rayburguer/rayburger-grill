-- 🛡️ SANEAMIENTO QUIRÚRGICO DE MENÚ RAY BURGER
-- Ejecuta esto en el SQL Editor de Supabase para eliminar duplicados y estabilizar el menú.

-- 1. Eliminar los combos duplicados y basura detectada
DELETE FROM public.rb_products 
WHERE id IN (12, 13, 15, 16, 17, 18, 19, 20, 21);

-- 2. Asegurar que las bebidas tengan una categoría limpia si no la tienen
UPDATE public.rb_products 
SET category = 'Bebidas' 
WHERE name ILIKE '%refresco%' OR name ILIKE '%pepsi%' OR name ILIKE '%coca%';

-- 3. [Opcional] Limpiar el localStorage en la próxima carga (el código ya lo manejará)

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Menú saneado: Se eliminaron los duplicados (12-21).';
END $$;
