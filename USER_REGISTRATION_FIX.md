# 🔧 User Registration Fix Guide

## 🚨 **ISSUE**: New accounts not being added to Supabase

### ✅ **SOLUTION STEPS**:

#### **Step 1: Run the Updated Database Schema**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the updated schema** from `cleanup-and-setup-simple.sql`

This will:
- ✅ Create all necessary tables
- ✅ Set up the user creation trigger
- ✅ Configure RLS policies (without recursion)
- ✅ Create indexes for performance

#### **Step 2: Test the Database Setup**

Run the test script to verify everything is working:

```bash
node scripts/test-database.js
```

You should see:
- ✅ Users table exists
- ✅ User creation trigger exists
- ✅ RLS policies are working

#### **Step 3: Create an Admin User**

1. **Sign up normally** through the application
2. **Go to Supabase Dashboard → Authentication → Users**
3. **Find your user** and copy their ID
4. **Run this SQL** in the SQL Editor:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

#### **Step 4: Add Admin Policies (Optional)**

If you need admin access to view all users/leads, run:

```sql
-- Run the admin policies script
-- This is in scripts/add-admin-policies.sql
```

### 🔍 **HOW IT WORKS NOW**:

#### **User Registration Flow**:
1. **User signs up** → Supabase Auth creates auth user
2. **Trigger fires** → `handle_new_user()` function runs
3. **User record created** → Added to `users` table automatically
4. **Provider detects** → Fetches user data and sets state
5. **User redirected** → To dashboard or login

#### **Fallback Mechanisms**:
- ✅ **Trigger-based creation** (primary)
- ✅ **Manual creation** in signup page (backup)
- ✅ **Provider retry logic** (if user not found)

### 🧪 **TESTING**:

#### **Test 1: Create New Account**
1. Go to `http://localhost:3000/signup`
2. Create a new account
3. Check Supabase Dashboard → Authentication → Users
4. Check Supabase Dashboard → Table Editor → users

#### **Test 2: Login**
1. Go to `http://localhost:3000/login`
2. Login with the new account
3. Should redirect to dashboard

#### **Test 3: Admin Access**
1. Make your user an admin (see Step 3 above)
2. Go to `http://localhost:3000/admin`
3. Should see admin dashboard

### 🐛 **TROUBLESHOOTING**:

#### **If users still aren't being created**:

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Look for errors in the `handle_new_user` function

2. **Verify Trigger**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

3. **Test Trigger Manually**:
   ```sql
   -- This should create a test user
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
   VALUES (gen_random_uuid(), 'test@example.com', 'password', NOW(), NOW(), NOW());
   ```

#### **If RLS is blocking access**:

1. **Temporarily disable RLS**:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```

2. **Test user creation**
3. **Re-enable RLS**:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

### 📋 **FILES UPDATED**:

- ✅ `app/signup/page.tsx` - Improved user creation logic
- ✅ `components/providers.tsx` - Better error handling
- ✅ `cleanup-and-setup-simple.sql` - Fixed RLS policies
- ✅ `scripts/test-database.js` - Database testing script
- ✅ `scripts/add-admin-policies.sql` - Admin policies script

### 🎯 **EXPECTED RESULT**:

After following these steps:
- ✅ New users will be automatically added to Supabase
- ✅ User registration will work smoothly
- ✅ Admin dashboard will be accessible
- ✅ All user management features will work

### 🚀 **NEXT STEPS**:

1. **Run the schema** in Supabase SQL Editor
2. **Test user registration**
3. **Create admin user**
4. **Test admin dashboard**
5. **Verify all features work**

---

**Need help?** Check the Supabase logs or run the test script to diagnose issues. 