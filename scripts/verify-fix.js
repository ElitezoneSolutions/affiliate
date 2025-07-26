const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verifying Database Fix...\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyFix() {
  try {
    console.log('1. Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      if (connectionError.message.includes('infinite recursion')) {
        console.log('❌ RLS Recursion still exists')
        console.log('💡 Please run the fix-database-now.sql script in Supabase SQL Editor')
        return
      } else {
        console.error('❌ Database error:', connectionError.message)
        return
      }
    }

    console.log('✅ Database connection working - RLS recursion fixed!')

    console.log('\n2. Testing user creation...')
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

    console.log('\n3. Testing user login...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError) {
      console.error('❌ Sign in error:', signInError.message)
      return
    }

    console.log('✅ User login successful')

    console.log('\n4. Testing user data fetch...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user?.id)
      .single()

    if (userError) {
      console.error('❌ User data fetch error:', userError.message)
      return
    }

    console.log('✅ User data fetch successful')

    console.log('\n🎉 FIX VERIFIED SUCCESSFULLY!')
    console.log('\n📋 Sign-in should now work:')
    console.log('- Go to http://localhost:3000/signup to create an account')
    console.log('- Go to http://localhost:3000/login to sign in')
    console.log('- The application should now work perfectly!')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyFix() 