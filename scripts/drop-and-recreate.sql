-- COMPLETE DATABASE RESET AND SETUP
-- First drops everything, then recreates from scratch

-- ========================================
-- STEP 1: DROP EVERYTHING FIRST
-- ========================================

-- Disable RLS
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_requests DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (including storage)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname IN ('public', 'storage')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ========================================
-- STEP 2: RECREATE TABLES
-- ========================================

-- Drop existing tables
DROP TABLE IF EXISTS payout_requests;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  payout_method TEXT,
  payout_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  program TEXT NOT NULL,
  lead_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  price DECIMAL,
  paid BOOLEAN DEFAULT false,
  call_requested BOOLEAN DEFAULT false,
  call_meeting_link TEXT,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create payout_requests table
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES users(id),
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_method TEXT NOT NULL,
  payout_details TEXT NOT NULL,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'paid'))
);

-- ========================================
-- STEP 3: ENABLE RLS
-- ========================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: CREATE NEW POLICIES
-- ========================================

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create policies for leads table
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT
  USING (
    auth.uid() = affiliate_id AND
    NOT EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_suspended = true
    )
  );

CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT
  WITH CHECK (
    auth.uid() = affiliate_id AND
    NOT EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_suspended = true
    )
  );

CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update leads" ON leads
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert leads" ON leads
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create policies for payout_requests table
CREATE POLICY "Users can view their own payout requests" ON payout_requests
  FOR SELECT
  USING (
    auth.uid() = affiliate_id AND
    NOT EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_suspended = true
    )
  );

CREATE POLICY "Users can insert payout requests" ON payout_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = affiliate_id AND
    NOT EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_suspended = true
    )
  );

CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can update payout requests" ON payout_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admins can insert payout requests" ON payout_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- ========================================
-- STEP 5: SETUP STORAGE
-- ========================================

-- Set up storage
INSERT INTO storage.buckets (id, name) 
VALUES ('avatars', 'avatars') 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_suspended = true
  )
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_suspended = true
  )
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_suspended = true
  )
);

-- ========================================
-- STEP 6: VERIFY SETUP
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
-- COMPLETE! NEXT STEPS:
-- ========================================
-- 1. Create a new account at http://localhost:3000/signup
-- 2. Make yourself admin by running:
--    UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
-- 3. Test login at http://localhost:3000/login
-- 4. Check admin dashboard at http://localhost:3000/admin/leads 