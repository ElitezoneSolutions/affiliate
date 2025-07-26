-- QUICK FIX: Resolve RLS Recursion Issue
-- Run this in Supabase SQL Editor IMMEDIATELY

-- Step 1: Drop all problematic admin policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can update all payout requests" ON payout_requests;

-- Step 2: Temporarily disable RLS to allow admin operations
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS with only basic policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate basic policies (no admin policies yet)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (affiliate_id = auth.uid());
CREATE POLICY "Users can insert their own leads" ON leads FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "Users can update their own leads" ON leads FOR UPDATE USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

CREATE POLICY "Users can view their own payout requests" ON payout_requests FOR SELECT USING (affiliate_id = auth.uid());
CREATE POLICY "Users can insert their own payout requests" ON payout_requests FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "Users can update their own payout requests" ON payout_requests FOR UPDATE USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

-- Step 5: Create a simple admin policy that doesn't cause recursion
-- This allows any authenticated user to view all data (we'll restrict this later)
CREATE POLICY "Allow all authenticated users to view all data" ON users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all authenticated users to view all leads" ON leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all authenticated users to view all payout requests" ON payout_requests FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 6: Create admin user (replace with your email)
-- UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';

-- This should fix the immediate recursion issue and allow the application to work
-- You can then add proper admin policies later using the add-admin-policies.sql script 