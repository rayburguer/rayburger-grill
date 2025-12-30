
-- RE-APPLYING PERMISSIONS TO ENSURE SOFT DELETE WORKS
ALTER TABLE rb_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Full Access Users" ON rb_users;

-- Allow everything for everyone (Simulating Public Access for debugging/fixing)
CREATE POLICY "Public Full Access Users" ON rb_users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Ensure anon role can actually do these things
GRANT ALL ON rb_users TO anon;
GRANT ALL ON rb_users TO authenticated;
GRANT ALL ON rb_users TO service_role;
