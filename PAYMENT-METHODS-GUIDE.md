# Payment Methods Debugging Guide

## 🔍 **Issue Description**
You mentioned that you can't find an option to add payment methods for affiliate users. Let me help you debug this step by step.

## 🛠️ **Debugging Steps**

### Step 1: Check Database Setup
First, ensure your database is properly set up:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the complete setup script**: `scripts/setup-database.sql`
4. **Verify the users table has the payout_methods column**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'payout_methods';
   ```

### Step 2: Test the Application
1. **Start the development server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000/dashboard/payout-settings`
3. **Look for the debug information** at the top of the page
4. **Click the "Test Database Connection" button** to verify database access

### Step 3: Check User Authentication
Make sure you're logged in as a **non-admin user**:
- Admin users are redirected to `/admin/leads`
- Only affiliate users can access the payout settings

### Step 4: Verify Component Rendering
The page should show:
1. **Debug info** with your user ID
2. **Database test component** with a test button
3. **Payment methods information card**
4. **Payment Methods Manager component** (with dashed border)

## 🎯 **Expected Behavior**

### ✅ **What You Should See**
1. **"Add Method" button** in the Payment Methods section
2. **Three payment method options**: PayPal, Wise, Bank Transfer
3. **Form fields** that appear when you click "Add Method"
4. **Empty state** if no payment methods are configured

### ❌ **Common Issues**

#### Issue 1: "Add Method" button not visible
**Cause**: Component not rendering or user not authenticated
**Solution**: Check browser console for errors

#### Issue 2: Database connection errors
**Cause**: Supabase not configured or database not set up
**Solution**: Run the database setup script

#### Issue 3: Permission denied errors
**Cause**: RLS policies not configured
**Solution**: Ensure all policies are created

#### Issue 4: User is admin
**Cause**: Admin users are redirected away
**Solution**: Create a non-admin user account

## 🔧 **Manual Database Test**

If the component isn't working, you can test the database manually:

```sql
-- Check if user exists and has payout_methods
SELECT id, email, payout_methods, default_payout_method 
FROM users 
WHERE id = 'your-user-id';

-- Test updating payout_methods
UPDATE users 
SET payout_methods = '[{"id":"test","type":"paypal","name":"Test","is_default":true,"details":{"paypal":{"email":"test@example.com"}},"created_at":"2024-01-01T00:00:00Z"}]'
WHERE id = 'your-user-id';
```

## 📱 **Component Structure**

The Payment Methods Manager component includes:

1. **Header section** with "Add Method" button
2. **Payment methods list** (empty if none configured)
3. **Add/Edit form** (appears when adding/editing)
4. **Form fields** for each payment method type:
   - **PayPal**: Email address
   - **Wise**: Name, Email, Account ID
   - **Bank Transfer**: Account name, Bank name, IBAN, SWIFT

## 🚀 **Quick Fix**

If you're still having issues:

1. **Clear browser cache and cookies**
2. **Log out and log back in**
3. **Check browser console for JavaScript errors**
4. **Verify your Supabase environment variables** in `.env.local`
5. **Run the database test** on the payout settings page

## 📞 **Next Steps**

If the debugging steps don't resolve the issue:

1. **Check the browser console** for any error messages
2. **Run the database test** and share the results
3. **Verify your user account** is not an admin
4. **Test with a fresh user account**

The payment methods functionality should work once the database is properly set up and you're logged in as a non-admin user. 