import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' 
      ? window.localStorage 
      : undefined,
    storageKey: 'supabase.auth.token',
    debug: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
})

export type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  profile_image: string
  is_admin: boolean
  payout_method?: string
  payout_details?: string
  created_at: string
}

export interface Lead {
  id: string
  affiliate_id: string
  full_name: string
  email: string
  phone: string
  website: string
  program: string
  lead_note: string
  status: 'pending' | 'approved' | 'rejected'
  price?: number | null
  paid: boolean
  call_requested: boolean
  call_meeting_link?: string
  admin_note?: string
  payout_request_id?: string
  created_at: string
}

export interface PayoutRequest {
  id: string
  affiliate_id: string
  amount: number
  method: string
  details: any
  status: 'requested' | 'approved' | 'rejected'
  note?: string
  created_at: string
} 