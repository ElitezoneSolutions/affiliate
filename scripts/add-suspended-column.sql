-- Add is_suspended column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_suspended'
    ) THEN
        ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update RLS policies to include suspension check
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Recreate policies with suspension checks
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id AND NOT is_suspended);

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

-- Update leads policies
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;

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

-- Update payout_requests policies
DROP POLICY IF EXISTS "Users can view their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Users can insert payout requests" ON payout_requests;

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

-- Update storage policies
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

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