'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, User } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { ToastProvider } from './toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If the users table doesn't exist yet, don't throw an error
        if (error.code === '42P01') { // Table doesn't exist
          console.warn('Users table does not exist yet')
          return null
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  const initializeAuth = async () => {
    try {
      setLoading(true)

      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession?.user) {
        const userData = await fetchUser(initialSession.user.id)
        setUser(userData)
        setSession(initialSession)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (error: any) {
      console.error('Error initializing auth:', error)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            const userData = await fetchUser(session.user.id)
            setUser(userData)
            setSession(session)
          } else {
            setUser(null)
            setSession(null)
          }
        } catch (error: any) {
          console.error('Error in auth state change:', error)
          setUser(null)
          setSession(null)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a Providers')
  }
  return context
} 