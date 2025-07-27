# Database Fix Guide - Payment Methods Issue

## 🚨 **Issue Identified**
Your database is missing the `payout_methods` and `default_payout_method` columns that are required for the payment methods functionality.

## ✅ **Solution: Run Migration Script**

### Step 1: Access Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script
1. **Copy the entire content** from `scripts/migrate-payment-methods.sql`
2. **Paste it** into the SQL Editor
3. **Click "Run"** to execute the script

### Step 3: Verify the Migration
After running the script, you should see output showing:
- ✅ Migration results with user counts
- ✅ Sample migrated data
- ✅ No errors

## 🔍 **What the Migration Does**

### ✅ **Adds New Columns**
- `default_payout_method` (TEXT) - Stores the user's default payment method
- `payout_methods` (JSONB) - Stores an array of payment methods

### ✅ **Migrates Existing Data**
- Converts old `payout_method` and `payout_details` to new structure
- Preserves all existing payment information
- Sets up default payment methods

### ✅ **Updates Payout Requests**
- Renames `details` column to `payment_details` for consistency

## 🧪 **Test the Fix**

### Step 1: Refresh Your Application
1. Go to `http://localhost:3000/dashboard/payout-settings`
2. You should now see the "Add Method" button
3. The database test should pass

### Step 2: Try Adding a Payment Method
1. Click **"Add Method"**
2. Select **PayPal** as the payment type
3. Enter a name like "My PayPal"
4. Enter your PayPal email
5. Click **"Add Method"**

### Step 3: Verify It Works
- The payment method should be saved
- You should see it in the list
- You can edit or delete it

## 🔧 **Manual Verification (Optional)**

If you want to verify the migration worked, run this SQL query:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('payout_methods', 'default_payout_method');

-- Check if data was migrated
SELECT 
    id,
    email,
    default_payout_method,
    jsonb_array_length(payout_methods) as payment_methods_count
FROM users 
LIMIT 5;
```

## 🚀 **Expected Results**

After running the migration:

### ✅ **Database Changes**
- `users` table has `payout_methods` column (JSONB)
- `users` table has `default_payout_method` column (TEXT)
- `payout_requests` table has `payment_details` column

### ✅ **Application Changes**
- Payment Methods Manager component renders properly
- "Add Method" button is visible
- Users can add/edit/delete payment methods
- Payment methods are saved to database

## 🆘 **If Migration Fails**

### Common Issues:

1. **Permission Denied**
   - Make sure you're using the correct Supabase project
   - Check that your user has admin privileges

2. **Column Already Exists**
   - The script is safe and won't create duplicate columns
   - It will skip existing columns

3. **Foreign Key Constraints**
   - The migration preserves all existing data
   - No foreign key issues should occur

### Get Help:
If you encounter any errors, share the error message and I'll help you resolve it.

## 🎉 **Success Indicators**

You'll know the fix worked when:

1. ✅ **No more "column does not exist" errors**
2. ✅ **"Add Method" button appears** on payout settings page
3. ✅ **Database test passes** with green success message
4. ✅ **Payment methods can be added and saved**

---

## 📞 **Next Steps**

1. **Run the migration script** in Supabase SQL Editor
2. **Test the application** by adding a payment method
3. **Remove debug components** once everything works
4. **Enjoy the full payment methods functionality!**

The migration is safe and will preserve all your existing data while adding the new payment methods functionality. 