
-- ⚠️ WARNING: THIS SCRIPT DELETES EVERYTHING. NUCLEAR OPTION.
-- Run this only if you want to start from ZERO users and ZERO orders.

-- 1. Disable RLS momentarily to allow truncation
ALTER TABLE "public"."rb_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rb_orders" DISABLE ROW LEVEL SECURITY;

-- 2. TRUNCATE DATA (Wipe clean)
-- CASCADE ensures that if orders depend on users, they also get deleted (though your schema uses arrays currently, standard clean is good)
TRUNCATE TABLE "public"."rb_users", "public"."rb_orders" RESTART IDENTITY CASCADE;

-- 3. Re-Enable RLS
ALTER TABLE "public"."rb_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rb_orders" ENABLE ROW LEVEL SECURITY;

-- 4. Create Initial ADMIN User (Raimundo) automatically so you don't have to register
-- Password hash for '412781' (Need to make sure this hash matches your bcrypt logic)
-- For now, we insert a placeholder validation or you create it via Register.
-- Actually, better to start CLEAN CLEAN. You register first in the new system.
