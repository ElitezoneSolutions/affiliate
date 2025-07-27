-- MIGRATION SCRIPT: Update to Multiple Payment Methods
-- Run this script to migrate existing single payment method to multiple payment methods structure
-- This script should be run AFTER the main setup-database.sql script

-- ========================================
-- STEP 1: BACKUP EXISTING DATA
-- ========================================

-- Create backup tables (optional - for safety)
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS payout_requests_backup AS SELECT * FROM payout_requests;

-- ========================================
-- STEP 2: MIGRATE USERS TABLE
-- ========================================

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add default_payout_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'default_payout_method') THEN
        ALTER TABLE users ADD COLUMN default_payout_method TEXT CHECK (default_payout_method IN ('paypal', 'wise', 'bank_transfer'));
    END IF;
    
    -- Add payout_methods column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'payout_methods') THEN
        ALTER TABLE users ADD COLUMN payout_methods JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Migrate existing payout_method and payout_details to new structure
UPDATE users 
SET 
    default_payout_method = CASE 
        WHEN payout_method IS NOT NULL THEN payout_method
        ELSE NULL
    END,
    payout_methods = CASE 
        WHEN payout_method IS NOT NULL AND payout_details IS NOT NULL THEN
            jsonb_build_array(
                jsonb_build_object(
                    'id', 'pm_' || extract(epoch from created_at)::text,
                    'type', payout_method,
                    'name', CASE 
                        WHEN payout_method = 'paypal' THEN 'PayPal Account'
                        WHEN payout_method = 'wise' THEN 'Wise Account'
                        WHEN payout_method = 'bank_transfer' THEN 'Bank Account'
                        ELSE 'Payment Method'
                    END,
                    'is_default', true,
                    'details', payout_details,
                    'created_at', created_at
                )
            )
        WHEN payout_method IS NOT NULL THEN
            jsonb_build_array(
                jsonb_build_object(
                    'id', 'pm_' || extract(epoch from created_at)::text,
                    'type', payout_method,
                    'name', CASE 
                        WHEN payout_method = 'paypal' THEN 'PayPal Account'
                        WHEN payout_method = 'wise' THEN 'Wise Account'
                        WHEN payout_method = 'bank_transfer' THEN 'Bank Account'
                        ELSE 'Payment Method'
                    END,
                    'is_default', true,
                    'details', '{}'::jsonb,
                    'created_at', created_at
                )
            )
        ELSE '[]'::jsonb
    END
WHERE payout_method IS NOT NULL;

-- ========================================
-- STEP 3: MIGRATE PAYOUT_REQUESTS TABLE
-- ========================================

-- Rename details column to payment_details if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'payout_requests' AND column_name = 'details') THEN
        ALTER TABLE payout_requests RENAME COLUMN details TO payment_details;
    END IF;
END $$;

-- ========================================
-- STEP 4: DROP OLD COLUMNS (OPTIONAL)
-- ========================================

-- Uncomment these lines if you want to remove the old columns after confirming migration worked
-- ALTER TABLE users DROP COLUMN IF EXISTS payout_method;
-- ALTER TABLE users DROP COLUMN IF EXISTS payout_details;

-- ========================================
-- STEP 5: VERIFICATION
-- ========================================

-- Check migration results
SELECT 
    'users' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN default_payout_method IS NOT NULL THEN 1 END) as users_with_default_method,
    COUNT(CASE WHEN jsonb_array_length(payout_methods) > 0 THEN 1 END) as users_with_payment_methods
FROM users
UNION ALL
SELECT 
    'payout_requests' as table_name,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN payment_details IS NOT NULL THEN 1 END) as requests_with_details,
    0 as unused_column
FROM payout_requests;

-- Show sample migrated data
SELECT 
    id,
    email,
    default_payout_method,
    jsonb_array_length(payout_methods) as payment_methods_count,
    payout_methods
FROM users 
WHERE jsonb_array_length(payout_methods) > 0 
LIMIT 5;

-- ========================================
-- MIGRATION COMPLETE!
-- ========================================

-- ✅ Existing payout_method and payout_details migrated to new structure
-- ✅ Users can now have multiple payment methods
-- ✅ Default payment method is preserved
-- ✅ Payout requests use payment_details column
-- ✅ All existing data is preserved

-- Next steps:
-- 1. Test the application with the new structure
-- 2. Verify that users can add/edit payment methods
-- 3. Confirm that payout requests work correctly
-- 4. If everything works, you can uncomment the DROP COLUMN lines above 