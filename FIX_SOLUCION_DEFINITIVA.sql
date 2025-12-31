
-- 1. Enable RLS (Security)
ALTER TABLE "public"."rb_users" ENABLE ROW LEVEL SECURITY;

-- 2. Allow Anonymous/Public Select (Read)
CREATE POLICY "Enable read access for all users" ON "public"."rb_users"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- 3. Allow Infinite Updates (The "Cable" Fix)
-- This allows anyone (including Anon scripts and the Admin Dashboard) to update rows.
-- Needed because the "Merge" and "Admin Edit" features run client-side.
CREATE POLICY "Enable update for all users" ON "public"."rb_users"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 4. Allow Inserts
CREATE POLICY "Enable insert for all users" ON "public"."rb_users"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- 5. Force Fix for "Cristhian" (Phone ending in 3644978)
-- We correct the name and balance in the cloud directly.
UPDATE rb_users 
SET 
    "walletBalance_usd" = 5.00,
    points = 50,
    name = 'Cristhian Diaz',
    role = 'customer'
WHERE phone LIKE '%4243644978%';
