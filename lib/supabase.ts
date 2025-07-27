import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  profile_image: string
  is_admin: boolean
  is_suspended?: boolean
  default_payout_method?: string
  payout_methods?: PaymentMethod[]
  created_at: string
}

export type PaymentMethod = {
  id: string
  type: 'paypal' | 'wise' | 'bank_transfer'
  name: string
  is_default: boolean
  details: {
    paypal?: {
      email: string
    }
    wise?: {
      name: string
      email: string
      account_id: string
    }
    bank_transfer?: {
      name: string
      iban: string
      bank_name: string
      swift: string
    }
  }
  created_at: string
}

export type Lead = {
  id: string
  affiliate_id: string
  full_name: string
  email: string
  phone?: string
  website?: string
  program: string
  lead_note?: string
  status: 'pending' | 'approved' | 'rejected'
  price?: number | null
  paid: boolean
  call_requested: boolean
  call_meeting_link?: string
  admin_note?: string
  payout_request_id?: string
  created_at: string
  updated_at: string
}

export interface PayoutRequest {
  id: string
  affiliate_id: string
  amount: number
  method: string
  payment_details: any
  status: 'requested' | 'approved' | 'rejected'
  note?: string
  created_at: string
} 