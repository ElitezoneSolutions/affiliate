-- Complete Database Setup for TrendHijacking Affiliate Program
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. CREATE TABLES
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
-- 2. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CREATE BASIC POLICIES
-- ========================================

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Leads policies
CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (affiliate_id = auth.uid());
CREATE POLICY "Users can insert their own leads" ON leads FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "Users can update their own leads" ON leads FOR UPDATE USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

-- Payout requests policies
CREATE POLICY "Users can view their own payout requests" ON payout_requests FOR SELECT USING (affiliate_id = auth.uid());
CREATE POLICY "Users can insert their own payout requests" ON payout_requests FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "Users can update their own payout requests" ON payout_requests FOR UPDATE USING (affiliate_id = auth.uid()) WITH CHECK (affiliate_id = auth.uid());

-- ========================================
-- 4. CREATE ADMIN POLICIES
-- ========================================

-- Admin policies for users
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Admin policies for leads
CREATE POLICY "Admins can view all leads" ON leads FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all leads" ON leads FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Admin policies for payout_requests
CREATE POLICY "Admins can view all payout requests" ON payout_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all payout requests" ON payout_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- ========================================
-- 5. SETUP STORAGE FOR PROFILE IMAGES
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

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- ========================================
-- 6. CREATE ADMIN USER
-- ========================================

-- After running this script, create an admin user by running:
-- UPDATE users SET is_admin = true WHERE email = 'your-admin-email@example.com';

-- ========================================
-- SETUP COMPLETE!
-- ======================================== 