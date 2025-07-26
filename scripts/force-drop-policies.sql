-- FORCE DROP ALL POLICIES
-- Run this first to clean up all policies

-- First, let's see what policies exist
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- Disable RLS temporarily
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_requests DISABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
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

-- Drop ALL storage policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Simple avatar access" ON storage.objects;

-- Drop any policy with 'admin' in the name
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE policyname ILIKE '%admin%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop any policy with 'user' in the name
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE policyname ILIKE '%user%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop any policy with 'simple' in the name
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE policyname ILIKE '%simple%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop any remaining policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname IN ('public', 'storage')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Let's see what policies are left
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- ========================================
-- NEXT STEP:
-- ========================================
-- Now run the complete-fix.sql script to create new policies 