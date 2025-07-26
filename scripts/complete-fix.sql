-- COMPLETE FIX: Everything in One Script
-- Run this in Supabase SQL Editor to fix all issues

-- ========================================
-- STEP 1: COMPLETELY DISABLE RLS
-- ========================================

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ========================================

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users to view all data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON users;
DROP POLICY IF EXISTS "Simple user access" ON users;

-- Drop ALL policies on leads table
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON leads;
DROP POLICY IF EXISTS "Allow all authenticated users to view all leads" ON leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON leads;
DROP POLICY IF EXISTS "Enable update for users based on email" ON leads;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON leads;
DROP POLICY IF EXISTS "Simple leads access" ON leads;

-- Drop ALL policies on payout_requests table
DROP POLICY IF EXISTS "Users can view their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Users can insert their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Users can update their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can update all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Allow all authenticated users to view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON payout_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON payout_requests;
DROP POLICY IF EXISTS "Enable update for users based on email" ON payout_requests;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON payout_requests;
DROP POLICY IF EXISTS "Simple payout access" ON payout_requests;

-- ========================================
-- STEP 3: CREATE TABLES (if they don't exist)
-- ========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image TEXT,
  is_admin BOOLEAN DEFAULT false,
  payout_method TEXT CHECK (payout_method IN ('paypal', 'wise', 'bank_transfer')),
  payout_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  program TEXT NOT NULL,
  lead_note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  price DECIMAL(10,2),
  paid BOOLEAN DEFAULT false,
  call_requested BOOLEAN DEFAULT false,
  call_meeting_link TEXT,
  admin_note TEXT,
  payout_request_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL,
  details JSONB,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 4: ENABLE RLS WITH PROPER POLICIES
-- ========================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: CREATE PROPER RLS POLICIES
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
-- STEP 6: LEADS TABLE POLICIES
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
-- STEP 7: PAYOUT REQUESTS POLICIES
-- ========================================

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
-- STEP 8: SETUP STORAGE
-- ========================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ========================================
-- STEP 9: CREATE ADMIN USER (OPTIONAL)
-- ========================================

-- Uncomment and modify the line below to make yourself an admin
-- Replace 'your-email@example.com' with your actual email address
-- UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';

-- ========================================
-- STEP 10: VERIFICATION
-- ========================================

-- Check if tables exist
SELECT 
  'users' as table_name,
  COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
  'leads' as table_name,
  COUNT(*) as row_count 
FROM leads
UNION ALL
SELECT 
  'payout_requests' as table_name,
  COUNT(*) as row_count 
FROM payout_requests;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'leads', 'payout_requests');

-- ========================================
-- COMPLETE FIX FINISHED!
-- ========================================

-- ✅ RLS policies fixed
-- ✅ Database tables created
-- ✅ Admin access configured
-- ✅ Storage setup complete
-- ✅ Login should now work
-- ✅ Admin dashboard should work
-- ✅ All authentication flows should work

-- Next steps:
-- 1. Test login at http://localhost:3000/login
-- 2. Create a user account at http://localhost:3000/signup
-- 3. Make yourself admin by running: UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
-- 4. Test admin dashboard at http://localhost:3000/admin/leads 