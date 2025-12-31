-- ==========================================
-- FASE 4: GESTIÓN DE MEDIA (STORAGE)
-- ==========================================
-- Ejecutar este script en el SQL Editor de Supabase.

-- 1. Crear Bucket 'product-images' (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- 3. Crear Políticas de Seguridad (RLS) en storage.objects

-- A) LECTURA: Pública para todos (Cualquiera puede ver la foto de la hamburguesa)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- B) INSERTAR: Solo Admins (Authenticated + Role Check 'admin')
CREATE POLICY "Admin Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND (select role from public.rb_users where id = auth.uid()) = 'admin'
);

-- C) ACTUALIZAR: Solo Admins
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND (select role from public.rb_users where id = auth.uid()) = 'admin'
);

-- D) ELIMINAR: Solo Admins
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND (select role from public.rb_users where id = auth.uid()) = 'admin'
);

-- Nota: Asegurarse de que RLS esté habilitado en storage.objects (por defecto lo está en Supabase)
