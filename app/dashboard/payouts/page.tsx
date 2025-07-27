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
  Plus,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'

interface PayoutRequest {
  id: string
  amount: number
  method: string
  payment_details: any
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
  const [selectedMethod, setSelectedMethod] = useState<string>('')

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

      // Set default payment method if user has one
      if (user?.default_payout_method) {
        setSelectedMethod(user.default_payout_method)
      }
    } catch (error: any) {
      console.error('Error fetching payout data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.default_payout_method])

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

    if (!selectedMethod) {
      setMessage({ type: 'error', text: 'Please select a payment method' })
      return
    }

    // Get the selected payment method details
    const paymentMethods = user?.payout_methods || []
    const selectedPaymentMethod = paymentMethods.find(method => method.type === selectedMethod)

    if (!selectedPaymentMethod) {
      setMessage({ type: 'error', text: 'Selected payment method not found. Please update your payment settings.' })
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
          method: selectedMethod,
          payment_details: selectedPaymentMethod.details,
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

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'paypal': return 'PayPal'
      case 'wise': return 'Wise'
      case 'bank_transfer': return 'Bank Transfer'
      default: return method
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'paypal': return '💳'
      case 'wise': return '🌍'
      case 'bank_transfer': return '🏦'
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const renderPaymentDetails = (payout: PayoutRequest) => {
    if (!payout.payment_details) {
      return <span className="text-gray-500">No payment details available</span>
    }

    const details = payout.payment_details
    const method = payout.method

    switch (method) {
      case 'paypal':
        return <span className="text-sm text-gray-600">{details.paypal?.email || 'Email not provided'}</span>
      case 'wise':
        return <span className="text-sm text-gray-600">{details.wise?.name || 'Name not provided'} ({details.wise?.email || 'Email not provided'})</span>
      case 'bank_transfer':
        return <span className="text-sm text-gray-600">{details.bank_transfer?.bank_name || 'Bank not provided'} - {details.bank_transfer?.iban?.slice(-4) || 'IBAN not provided'}</span>
      default:
        return <span className="text-sm text-gray-600">Unknown payment method</span>
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
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
              <p className="text-gray-600">Request and track your payouts</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${unpaidEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Available for payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payoutRequests.length}</div>
              <p className="text-xs text-muted-foreground">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {payoutRequests.filter(p => p.status === 'requested').length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Payout */}
        {unpaidEarnings >= 100 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
              <CardDescription>
                Request a payout for your unpaid earnings (minimum $100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  >
                    <option value="">Select a payment method</option>
                    {user?.payout_methods?.map((method) => (
                      <option key={method.id} value={method.type}>
                        {method.name} ({getMethodLabel(method.type)})
                      </option>
                    ))}
                  </select>
                  {user?.payout_methods?.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No payment methods configured. Please{' '}
                      <Link href="/dashboard/payout-settings" className="text-blue-600 hover:underline">
                        add a payment method
                      </Link>{' '}
                      first.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleRequestPayout}
                    disabled={requestingPayout || !selectedMethod || (user?.payout_methods?.length || 0) === 0}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {requestingPayout ? 'Requesting...' : `Request $${unpaidEarnings.toFixed(2)} Payout`}
                  </Button>
                  
                  <Link href="/dashboard/payout-settings">
                    <Button variant="outline">
                      Manage Payment Methods
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMethodIcon(payout.method)}</span>
                        <span>{getMethodLabel(payout.method)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span> {new Date(payout.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Details:</span> {renderPaymentDetails(payout)}
                      </div>
                    </div>

                    {payout.note && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium">Admin Note:</span> {payout.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 