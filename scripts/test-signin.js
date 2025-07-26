const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Sign-In Process...\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignIn() {
  try {
    console.log('1. Testing basic connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      if (connectionError.message.includes('infinite recursion')) {
        console.log('❌ RLS Recursion Issue Detected')
        console.log('💡 This is preventing user registration and login')
        console.log('🔧 Solution: Run scripts/fix-database-now.sql in Supabase SQL Editor')
        return
      } else if (connectionError.code === '42P01') {
        console.log('❌ Users table does not exist')
        console.log('💡 Solution: Run cleanup-and-setup-simple.sql in Supabase SQL Editor')
        return
      } else {
        console.error('❌ Database error:', connectionError.message)
        return
      }
    }

    console.log('✅ Database connection working')

    console.log('\n2. Testing auth connection...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }

    console.log('✅ Auth connection working')

    console.log('\n3. Testing user creation...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.error('❌ Sign up error:', signUpError.message)
      return
    }

    console.log('✅ User creation successful')
    console.log(`   User ID: ${signUpData.user?.id}`)
    console.log(`   Email: ${signUpData.user?.email}`)

    console.log('\n4. Testing user login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError) {
      console.error('❌ Sign in error:', signInError.message)
      return
    }

    console.log('✅ User login successful')
    console.log(`   Session: ${signInData.session ? 'Active' : 'None'}`)

    console.log('\n5. Testing user data fetch...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user?.id)
      .single()

    if (userError) {
      console.error('❌ User data fetch error:', userError.message)
      console.log('💡 This suggests the user record was not created in the users table')
      return
    }

    console.log('✅ User data fetch successful')
    console.log(`   User record: ${userData ? 'Found' : 'Not found'}`)

    console.log('\n🎉 Sign-in process test completed successfully!')
    console.log('\n📋 Summary:')
    console.log('- Database connection: ✅ Working')
    console.log('- Auth connection: ✅ Working')
    console.log('- User creation: ✅ Working')
    console.log('- User login: ✅ Working')
    console.log('- User data fetch: ✅ Working')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSignIn() 