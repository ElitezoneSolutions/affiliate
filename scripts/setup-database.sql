-- DATABASE SETUP FOR TRENDHIJACKING AFFILIATE PROGRAM
-- This is the complete and final database setup script
-- Run this in Supabase SQL Editor

-- ========================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- ========================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- STEP 2: DROP EXISTING TABLES (CLEAN SLATE)
-- ========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;

DROP POLICY IF EXISTS "Users can view their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Users can insert their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Users can update their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can update all payout requests" ON payout_requests;

-- Drop existing functions
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS is_user_suspended();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_user_stats(UUID);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_payout_requests_updated_at ON payout_requests;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_is_admin;
DROP INDEX IF EXISTS idx_users_is_suspended;
DROP INDEX IF EXISTS idx_users_created_at;

DROP INDEX IF EXISTS idx_leads_affiliate_id;
DROP INDEX IF EXISTS idx_leads_status;
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_leads_program;
DROP INDEX IF EXISTS idx_leads_paid;

DROP INDEX IF EXISTS idx_payout_requests_affiliate_id;
DROP INDEX IF EXISTS idx_payout_requests_status;
DROP INDEX IF EXISTS idx_payout_requests_created_at;
DROP INDEX IF EXISTS idx_payout_requests_method;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS payout_requests CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- STEP 3: CREATE TABLES FROM SCRATCH
-- ========================================

-- Users table - stores affiliate and admin user information
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  default_payout_method TEXT CHECK (default_payout_method IN ('paypal', 'wise', 'bank_transfer')),
  payout_methods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table - stores submitted leads from affiliates
CREATE TABLE leads (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout requests table - stores payout requests from affiliates
CREATE TABLE payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  payment_details JSONB,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected')),
  note TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_is_suspended ON users(is_suspended);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Leads table indexes
CREATE INDEX idx_leads_affiliate_id ON leads(affiliate_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_program ON leads(program);
CREATE INDEX idx_leads_paid ON leads(paid);

-- Payout requests table indexes
CREATE INDEX idx_payout_requests_affiliate_id ON payout_requests(affiliate_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_created_at ON payout_requests(created_at);
CREATE INDEX idx_payout_requests_method ON payout_requests(method);

-- ========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to check if current user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists and is admin
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is suspended (avoids recursion)
CREATE OR REPLACE FUNCTION is_user_suspended()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_suspended = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_leads BIGINT,
  approved_leads BIGINT,
  pending_leads BIGINT,
  rejected_leads BIGINT,
  total_earnings DECIMAL,
  unpaid_earnings DECIMAL,
  paid_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_leads,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_leads,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leads,
    COALESCE(SUM(price) FILTER (WHERE status = 'approved'), 0) as total_earnings,
    COALESCE(SUM(price) FILTER (WHERE status = 'approved' AND NOT paid), 0) as unpaid_earnings,
    COALESCE(SUM(price) FILTER (WHERE status = 'approved' AND paid), 0) as paid_earnings
  FROM leads
  WHERE affiliate_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 7: CREATE TRIGGERS
-- ========================================

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 8: CREATE USER POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not if suspended)
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id AND NOT is_suspended);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (is_admin_user());

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  USING (is_admin_user());

-- ========================================
-- STEP 9: CREATE LEADS POLICIES
-- ========================================

-- Regular users can view their own leads (if not suspended)
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT
  USING (
    affiliate_id = auth.uid() AND
    NOT is_user_suspended()
  );

-- Regular users can insert their own leads (if not suspended)
CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT
  WITH CHECK (
    affiliate_id = auth.uid() AND
    NOT is_user_suspended()
  );

-- Regular users can update their own leads (if not suspended)
CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE
  USING (
    affiliate_id = auth.uid() AND
    NOT is_user_suspended()
  );

-- Admins can view ALL leads
CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT
  USING (is_admin_user());

-- Admins can update ALL leads
CREATE POLICY "Admins can update all leads" ON leads
  FOR UPDATE
  USING (is_admin_user());

-- Admins can insert leads
CREATE POLICY "Admins can insert leads" ON leads
  FOR INSERT
  WITH CHECK (is_admin_user());

-- ========================================
-- STEP 10: CREATE PAYOUT REQUESTS POLICIES
-- ========================================

-- Regular users can view their own payout requests (if not suspended)
CREATE POLICY "Users can view their own payout requests" ON payout_requests
  FOR SELECT
  USING (
    affiliate_id = auth.uid() AND
    NOT is_user_suspended()
  );

-- Regular users can insert their own payout requests (if not suspended)
CREATE POLICY "Users can insert their own payout requests" ON payout_requests
  FOR INSERT
  WITH CHECK (
    affiliate_id = auth.uid() AND
    NOT is_user_suspended()
  );

-- Regular users can update their own payout requests (if not suspended)
CREATE POLICY "Users can update their own payout requests" ON payout_requests
  FOR UPDATE
  USING (
    affiliate_id = auth.uid() AND
    NOT is_user_suspended()
  );

-- Admins can view ALL payout requests
CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR SELECT
  USING (is_admin_user());

-- Admins can update ALL payout requests
CREATE POLICY "Admins can update all payout requests" ON payout_requests
  FOR UPDATE
  USING (is_admin_user());

-- ========================================
-- STEP 11: SETUP STORAGE BUCKETS
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

-- Create storage bucket for documents (optional)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STEP 12: CREATE STORAGE POLICIES
-- ========================================

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT is_user_suspended()
  );

CREATE POLICY "Users can view all avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT is_user_suspended()
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT is_user_suspended()
  );

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT is_user_suspended()
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT is_user_suspended()
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    NOT is_user_suspended()
  );

-- ========================================
-- STEP 13: VERIFICATION
-- ========================================

-- Check if tables exist and have correct structure
SELECT 
  'users' as table_name,
  COUNT(*) as row_count,
  'Table exists' as status
FROM users
UNION ALL
SELECT 
  'leads' as table_name,
  COUNT(*) as row_count,
  'Table exists' as status
FROM leads
UNION ALL
SELECT 
  'payout_requests' as table_name,
  COUNT(*) as row_count,
  'Table exists' as status
FROM payout_requests;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'leads', 'payout_requests');

-- Check storage buckets
SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id IN ('avatars', 'documents');

-- ========================================
-- SETUP COMPLETE!
-- ========================================

-- ✅ All existing tables dropped and recreated
-- ✅ All extensions enabled
-- ✅ All tables created with correct structure
-- ✅ All indexes created for performance
-- ✅ Row Level Security enabled on all tables
-- ✅ User policies with suspension checks (NO RECURSION)
-- ✅ Admin policies for full access (NO RECURSION)
-- ✅ Storage buckets and policies configured
-- ✅ Triggers for automatic timestamp updates
-- ✅ Helper functions for statistics
-- ✅ All authentication flows supported
-- ✅ User suspension functionality included
-- ✅ Admin user management features ready
-- ✅ File upload support for avatars and documents
-- ✅ Complete payout system ready
-- ✅ FIXED: No more column errors or recursion issues
-- ✅ NEW: Multiple payment methods support
-- ✅ NEW: Improved payout details structure

-- Next steps:
-- 1. Configure Authentication settings in Supabase dashboard
-- 2. Set Site URL to: http://localhost:3000
-- 3. Add redirect URLs: http://localhost:3000, http://localhost:3000/login, http://localhost:3000/signup
-- 4. Test login at http://localhost:3000/login
-- 5. Create a user account at http://localhost:3000/signup
-- 6. Make yourself admin by running: UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
-- 7. Test admin dashboard at http://localhost:3000/admin/leads
-- 8. Test user suspension features in admin panel
-- 9. Test multiple payment methods in user dashboard 