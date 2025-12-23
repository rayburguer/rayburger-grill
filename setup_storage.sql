-- 1. Crear el bucket 'products' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;

-- 3. Crear política para VER imágenes (Acceso total público)
CREATE POLICY "Allow Public Viewing"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'products' );

-- 4. Crear política para SUBIR imágenes (Acceso total público - Necesario para tu Admin actual)
CREATE POLICY "Allow Public Uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'products' );

-- 5. Crear política para ACTUALIZAR imágenes (Opcional, por si reemplazas fotos)
CREATE POLICY "Allow Public Updates"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'products' );
