-- ========================================================
-- MEJORA DE SEGURIDAD: FIX RLS SECURITY
-- Este script elimina el acceso público total y aplica 
-- políticas restrictivas basadas en autenticación.
-- ========================================================

-- 0. Función de ayuda para verificar si es admin (Evita recursión infinita)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM rb_users 
    WHERE id = auth.uid()::text 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Asegurar rb_products
ALTER TABLE rb_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ReadOnly_Public_Products" ON rb_products;
DROP POLICY IF EXISTS "Admin_All_Products" ON rb_products;

CREATE POLICY "ReadOnly_Public_Products" ON rb_products FOR SELECT USING (true);
CREATE POLICY "Admin_All_Products" ON rb_products FOR ALL USING (is_admin());

-- 2. Asegurar rb_users
ALTER TABLE rb_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users_View_Self" ON rb_users;
DROP POLICY IF EXISTS "Users_Update_Self" ON rb_users;
DROP POLICY IF EXISTS "Admin_All_Users" ON rb_users;

CREATE POLICY "Users_View_Self" ON rb_users FOR SELECT USING (id = auth.uid()::text);
CREATE POLICY "Users_Update_Self" ON rb_users FOR UPDATE USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY "Admin_All_Users" ON rb_users FOR ALL USING (is_admin());

-- 3. Asegurar rb_orders
ALTER TABLE rb_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users_View_Own_Orders" ON rb_orders;
DROP POLICY IF EXISTS "Users_Add_Own_Orders" ON rb_orders;
DROP POLICY IF EXISTS "Admin_All_Orders" ON rb_orders;

CREATE POLICY "Users_View_Own_Orders" ON rb_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM rb_users WHERE id = auth.uid()::text AND phone = "customerPhone")
  OR id = auth.uid()::text
);
CREATE POLICY "Users_Add_Own_Orders" ON rb_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin_All_Orders" ON rb_orders FOR ALL USING (is_admin());

-- 4. Asegurar rb_settings
ALTER TABLE rb_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public_Read_Settings" ON rb_settings;
DROP POLICY IF EXISTS "Admin_All_Settings" ON rb_settings;

CREATE POLICY "Public_Read_Settings" ON rb_settings FOR SELECT USING (true);
CREATE POLICY "Admin_All_Settings" ON rb_settings FOR ALL USING (is_admin());

-- NOTA: Si usas Supabase Auth, asegúrate de que el 'id' en rb_users 
-- coincida con el UUID del usuario autenticado.
