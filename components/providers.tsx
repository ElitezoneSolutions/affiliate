'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, User } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { setAuthCookie, getAuthCookie, clearAuthCookie } from '@/lib/cookies'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async (userId: string, userEmail: string) => {
    try {
      console.log('🔍 Fetching user data for:', userEmail)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "users" does not exist')) {
          console.log('📋 Creating temporary user (table doesn\'t exist)')
          const tempUser: User = {
            id: userId,
            email: userEmail,
            first_name: '',
            last_name: '',
            profile_image: '',
            is_admin: false,
            created_at: new Date().toISOString()
          }
          setUser(tempUser)
          return
        }
        
        // Try to create user if they don't exist
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            first_name: '',
            last_name: '',
            is_admin: false,
          })
          .select()
          .single()

        if (insertError) {
          if (insertError.message.includes('duplicate key')) {
            // User exists, fetch them
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single()
            
            if (existingUser) {
              console.log('✅ Fetched existing user')
              setUser(existingUser)
            }
          } else {
            console.error('❌ Error creating user:', insertError)
            setUser(null)
          }
        } else if (newUser) {
          console.log('✅ Created new user')
          setUser(newUser)
        }
      } else {
        console.log('✅ Fetched user data')
        setUser(data)
      }
    } catch (error) {
      console.error('❌ Error in fetchUser:', error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get session from Supabase
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          throw sessionError
        }

        if (initialSession) {
          console.log('✅ Found Supabase session')
          setSession(initialSession)
          setAuthCookie(initialSession)
          await fetchUser(initialSession.user.id, initialSession.user.email || '')
        } else {
          // Try to restore from cookies
          console.log('🔄 Trying to restore from cookies...')
          const cookieSession = getAuthCookie()
          
          if (cookieSession?.access_token && cookieSession?.refresh_token) {
            try {
              const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
                access_token: cookieSession.access_token,
                refresh_token: cookieSession.refresh_token
              })

              if (restoreError) {
                console.error('❌ Error restoring session:', restoreError)
                clearAuthCookie()
                throw restoreError
              }

              if (restoredSession) {
                console.log('✅ Restored session from cookies')
                setSession(restoredSession)
                await fetchUser(restoredSession.user.id, restoredSession.user.email || '')
              }
            } catch (error) {
              console.error('❌ Failed to restore session:', error)
              clearAuthCookie()
            }
          } else {
            console.log('❌ No session found')
            setUser(null)
            setSession(null)
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        setUser(null)
        setSession(null)
        clearAuthCookie()
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return

      console.log('🔄 Auth state change:', event)

      if (currentSession) {
        console.log('✅ New session detected')
        setSession(currentSession)
        setAuthCookie(currentSession)
        await fetchUser(currentSession.user.id, currentSession.user.email || '')
      } else {
        console.log('❌ Session ended')
        setUser(null)
        setSession(null)
        clearAuthCookie()
      }
    })

    // Initialize
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUser])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      clearAuthCookie()
      setUser(null)
      setSession(null)
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 