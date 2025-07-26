-- FIX ADMIN ACCESS TO LEADS
-- Run this in Supabase SQL Editor to fix admin dashboard

-- ========================================
-- STEP 1: DROP EXISTING SIMPLE POLICIES
-- ========================================

-- Drop the simple policies that are too restrictive
DROP POLICY IF EXISTS "Simple leads access" ON leads;
DROP POLICY IF EXISTS "Simple user access" ON users;

-- ========================================
-- STEP 2: CREATE PROPER RLS POLICIES
-- ========================================

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- STEP 3: LEADS TABLE POLICIES
-- ========================================

-- Regular users can view their own leads
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (affiliate_id = auth.uid());

-- Regular users can insert their own leads
CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT WITH CHECK (affiliate_id = auth.uid());

-- Regular users can update their own leads
CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (affiliate_id = auth.uid());

-- Admins can view ALL leads (this is the key fix!)
CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update ALL leads
CREATE POLICY "Admins can update all leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert leads (if needed)
CREATE POLICY "Admins can insert leads" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- STEP 4: PAYOUT REQUESTS POLICIES
-- ========================================

-- Drop existing simple policy
DROP POLICY IF EXISTS "Simple payout access" ON payout_requests;

-- Regular users can view their own payout requests
CREATE POLICY "Users can view their own payout requests" ON payout_requests
  FOR SELECT USING (affiliate_id = auth.uid());

-- Regular users can insert their own payout requests
CREATE POLICY "Users can insert their own payout requests" ON payout_requests
  FOR INSERT WITH CHECK (affiliate_id = auth.uid());

-- Regular users can update their own payout requests
CREATE POLICY "Users can update their own payout requests" ON payout_requests
  FOR UPDATE USING (affiliate_id = auth.uid());

-- Admins can view ALL payout requests
CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update ALL payout requests
CREATE POLICY "Admins can update all payout requests" ON payout_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- STEP 5: VERIFY ADMIN USER EXISTS
-- ========================================

-- Check if you have an admin user, if not create one
-- Replace 'your-email@example.com' with your actual email
-- UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';

-- ========================================
-- FIX COMPLETE!
-- ========================================

-- Now admins can see all leads in the admin dashboard
-- Regular users can only see their own leads
-- The admin dashboard should work properly now 