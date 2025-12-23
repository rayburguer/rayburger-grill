-- ==========================================
-- RAY BURGER GRILL - Database Setup Script
-- ==========================================
-- Este script es seguro de ejecutar múltiples veces.
-- 1. Crea las tablas si no existen.
-- 2. Agrega las columnas nuevas si faltan (Actualización de Schema).
-- 3. Repara los permisos de seguridad (RLS) para permitir la sincronización.

-- ------------------------------------------
-- 1. Tabla: rb_products
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS rb_products (
  id bigint PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Agregar columnas (Idempotente)
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "basePrice_usd" numeric;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "image" text;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "isAvailable" boolean DEFAULT true;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "stockQuantity" numeric;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "rating" numeric;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "ratingCount" numeric;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "customizableOptions" jsonb;
ALTER TABLE rb_products ADD COLUMN IF NOT EXISTS "highlight" text;

-- Seguridad rb_products
ALTER TABLE rb_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Products" ON rb_products;
CREATE POLICY "Public Full Access Products" ON rb_products FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------
-- 2. Tabla: rb_users
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS rb_users (
  id text PRIMARY KEY, -- Email o Teléfono usado como ID
  created_at timestamptz DEFAULT now()
);

-- Agregar columnas
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "passwordHash" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "referralCode" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "referredByCode" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "points" numeric DEFAULT 0;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "cashbackBalance_usd" numeric DEFAULT 0;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "loyaltyTier" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "orders" jsonb; -- Historial comprimido si es necesario
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "referralStats" jsonb;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "unlockedRewards" jsonb;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "redeemedRewards" jsonb;
ALTER TABLE rb_users ADD COLUMN IF NOT EXISTS "lastSpinDate" numeric;

-- Seguridad rb_users
ALTER TABLE rb_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Users" ON rb_users;
CREATE POLICY "Public Full Access Users" ON rb_users FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------
-- 3. Tabla: rb_orders
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS rb_orders (
  id text PRIMARY KEY, -- OrderId
  created_at timestamptz DEFAULT now()
);

-- Agregar columnas
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "timestamp" numeric;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "totalUsd" numeric;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "items" jsonb;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "pointsEarned" numeric;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "deliveryMethod" text;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "deliveryFee" numeric;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "customerName" text;
ALTER TABLE rb_orders ADD COLUMN IF NOT EXISTS "customerPhone" text;

-- Seguridad rb_orders
ALTER TABLE rb_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Orders" ON rb_orders;
CREATE POLICY "Public Full Access Orders" ON rb_orders FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------
-- 4. Tabla: rb_settings
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS rb_settings (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Agregar columnas
ALTER TABLE rb_settings ADD COLUMN IF NOT EXISTS "value" numeric; -- Para la Tasa
ALTER TABLE rb_settings ADD COLUMN IF NOT EXISTS "meta" jsonb; -- Para datos extra si se necesitan

-- Seguridad rb_settings
ALTER TABLE rb_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access Settings" ON rb_settings;
CREATE POLICY "Public Full Access Settings" ON rb_settings FOR ALL USING (true) WITH CHECK (true);

-- Fin del Script
