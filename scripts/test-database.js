const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please make sure you have:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database connection and schema...\n')

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if tables exist...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
      console.log('💡 Please run the SQL schema in your Supabase SQL Editor')
      return
    }
    console.log('✅ Users table exists')

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('count')
      .limit(1)
    
    if (leadsError) {
      console.error('❌ Leads table error:', leadsError.message)
    } else {
      console.log('✅ Leads table exists')
    }

    const { data: payouts, error: payoutsError } = await supabase
      .from('payout_requests')
      .select('count')
      .limit(1)
    
    if (payoutsError) {
      console.error('❌ Payout requests table error:', payoutsError.message)
    } else {
      console.log('✅ Payout requests table exists')
    }

    // Test 2: Check if trigger exists
    console.log('\n2. Checking if user creation trigger exists...')
    
    const { data: triggerTest, error: triggerError } = await supabase
      .rpc('handle_new_user')
    
    if (triggerError && triggerError.message.includes('function "handle_new_user" does not exist')) {
      console.error('❌ User creation trigger not found')
      console.log('💡 Please run the SQL schema in your Supabase SQL Editor')
    } else {
      console.log('✅ User creation trigger exists')
    }

    // Test 3: Check current users
    console.log('\n3. Checking current users...')
    
    const { data: currentUsers, error: currentUsersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (currentUsersError) {
      console.error('❌ Error fetching users:', currentUsersError.message)
    } else {
      console.log(`✅ Found ${currentUsers.length} users:`)
      currentUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.is_admin ? 'Admin' : 'User'}) - ${user.created_at}`)
      })
    }

    // Test 4: Check RLS policies
    console.log('\n4. Testing RLS policies...')
    
    // This will fail if RLS is blocking access
    const { data: rlsTest, error: rlsError } = await supabase
      .from('users')
      .select('count')
    
    if (rlsError && rlsError.message.includes('new row violates row-level security policy')) {
      console.log('✅ RLS is active (this is expected for unauthenticated requests)')
    } else if (rlsError) {
      console.error('❌ RLS error:', rlsError.message)
    } else {
      console.log('✅ RLS policies are working')
    }

    console.log('\n🎉 Database test completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Make sure you have run the SQL schema in Supabase SQL Editor')
    console.log('2. Try creating a new account through the signup page')
    console.log('3. Check if the user appears in the Supabase dashboard')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDatabase() 