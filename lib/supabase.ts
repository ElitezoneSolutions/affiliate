import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  profile_image?: string
  is_admin: boolean
  payout_method?: 'paypal' | 'wise' | 'bank_transfer'
  payout_details?: any
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