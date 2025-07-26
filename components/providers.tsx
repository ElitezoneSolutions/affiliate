'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, User } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'

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

  const fetchUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle table doesn't exist error
        if (error.code === '42P01' || error.message.includes('relation "users" does not exist')) {
          const tempUser: User = {
            id: userId,
            email: session?.user?.email || '',
            first_name: '',
            last_name: '',
            profile_image: '',
            is_admin: false,
            payout_method: undefined,
            payout_details: undefined,
            created_at: new Date().toISOString()
          }
          setUser(tempUser)
          setLoading(false)
          return
        }
        
        // Try to create user if they don't exist
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: session?.user?.email || '',
            first_name: '',
            last_name: '',
            is_admin: false,
          })
          .select()
          .single()

        if (insertError && insertError.message.includes('duplicate key')) {
          // User already exists, fetch them
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          setUser(existingUser)
        } else if (newUser) {
          setUser(newUser)
        } else {
          setUser(null)
        }
      } else {
        setUser(data)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.email])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchUser(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUser])

  // Prevent flashing on page refresh
  useEffect(() => {
    if (!loading && !user && !session) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, user, session])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 