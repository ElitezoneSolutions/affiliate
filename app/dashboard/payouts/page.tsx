'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardNav } from '@/components/dashboard-nav'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface PayoutRequest {
  id: string
  amount: number
  method: string
  details: any
  status: 'requested' | 'approved' | 'rejected'
  note?: string
  created_at: string
}

export default function PayoutsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [unpaidEarnings, setUnpaidEarnings] = useState(0)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchPayoutData = useCallback(async () => {
    try {
      // Fetch unpaid earnings
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('price, paid')
        .eq('affiliate_id', user?.id)
        .eq('status', 'approved')

      if (leadsError) throw leadsError

      const unpaid = leads?.reduce((sum, lead) => 
        !lead.paid ? sum + (lead.price || 0) : sum, 0) || 0
      setUnpaidEarnings(unpaid)

      // Fetch payout requests
      const { data: payouts, error: payoutsError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('affiliate_id', user?.id)
        .order('created_at', { ascending: false })

      if (payoutsError) throw payoutsError
      setPayoutRequests(payouts || [])
    } catch (error: any) {
      console.error('Error fetching payout data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.is_admin) {
      router.replace('/admin/leads')
      return
    }

    fetchPayoutData()
  }, [user, router, fetchPayoutData])

  const handleRequestPayout = async () => {
    if (unpaidEarnings < 100) {
      setMessage({ type: 'error', text: 'You need at least $100 in unpaid earnings to request a payout' })
      return
    }

    setRequestingPayout(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          affiliate_id: user?.id,
          amount: unpaidEarnings,
          method: user?.payout_method || 'paypal',
          details: user?.payout_details || {},
          status: 'requested'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Payout request submitted successfully!' })
      fetchPayoutData() // Refresh data
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setRequestingPayout(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600">Manage your earnings and payout requests</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Unpaid Earnings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Unpaid Earnings
              </CardTitle>
              <CardDescription>
                Total amount available for payout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">${unpaidEarnings}</div>
                  <p className="text-sm text-gray-600">
                    {unpaidEarnings >= 100 
                      ? 'You can request a payout' 
                      : `You need $${100 - unpaidEarnings} more to request a payout`
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleRequestPayout}
                  disabled={unpaidEarnings < 100 || requestingPayout}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {requestingPayout ? 'Requesting...' : 'Request Payout'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                View all your payout requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutRequests.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payout requests yet</p>
                  <p className="text-sm text-gray-500">Submit your first payout request when you have unpaid earnings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payoutRequests.map((payout) => (
                    <div key={payout.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          <span className="font-medium">${payout.amount}</span>
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Method:</span> {payout.method}
                        </div>
                        <div>
                          <span className="font-medium">Requested:</span> {new Date(payout.created_at).toLocaleDateString()}
                        </div>
                        {payout.note && (
                          <div>
                            <span className="font-medium">Note:</span> {payout.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout Settings Link */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Configure your preferred payout method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Set up your PayPal, Wise, or bank transfer details to receive payouts.
              </p>
              <Link href="/dashboard/payout-settings">
                <Button variant="outline">
                  Configure Payout Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 