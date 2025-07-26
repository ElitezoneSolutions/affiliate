-- EMERGENCY FIX: Complete RLS Reset
-- Run this in Supabase SQL Editor to fix the infinite recursion

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
-- STEP 4: ENABLE RLS WITH SIMPLE POLICIES
-- ========================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Simple user access" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Simple leads access" ON leads FOR ALL USING (affiliate_id = auth.uid());
CREATE POLICY "Simple payout access" ON payout_requests FOR ALL USING (affiliate_id = auth.uid());

-- ========================================
-- STEP 5: SETUP STORAGE
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

-- Simple storage policies
CREATE POLICY "Simple avatar access" ON storage.objects FOR ALL USING (bucket_id = 'avatars');

-- ========================================
-- EMERGENCY FIX COMPLETE!
-- ======================================== 