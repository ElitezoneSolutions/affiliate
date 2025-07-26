const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please check your .env.local file contains:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('✅ Environment variables found')
console.log(`URL: ${supabaseUrl}`)
console.log(`Key: ${supabaseKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔗 Testing connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Users table does not exist - this is expected if database is not set up yet')
        console.log('💡 Please run the database setup scripts in Supabase SQL Editor')
      } else if (error.message.includes('infinite recursion')) {
        console.log('⚠️  RLS recursion detected - this is expected if admin policies are causing issues')
        console.log('💡 Please run scripts/fix-database-now.sql in Supabase SQL Editor')
      } else {
        console.error('❌ Database error:', error.message)
      }
    } else {
      console.log('✅ Database connection successful')
    }

    // Test auth connection
    console.log('\n🔐 Testing auth connection...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Auth connection successful')
    }

    console.log('\n🎉 Supabase connection test completed!')
    console.log('\n📋 Next steps:')
    console.log('1. If tables don\'t exist: Run cleanup-and-setup-simple.sql')
    console.log('2. If RLS recursion: Run scripts/fix-database-now.sql')
    console.log('3. For storage: Run scripts/setup-storage.sql')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testConnection() 