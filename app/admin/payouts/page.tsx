'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  Search, 
  Filter, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  AlertCircle,
  ArrowLeft,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin-layout'

interface PayoutRequest {
  id: string
  affiliate_id: string
  amount: number
  method: string
  details: any
  status: 'requested' | 'approved' | 'rejected'
  note?: string
  created_at: string
  user: {
    email: string
    first_name: string
    last_name: string
  }
}

export default function AdminPayoutsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [filteredPayouts, setFilteredPayouts] = useState<PayoutRequest[]>([])
  const [processingPayout, setProcessingPayout] = useState<string | null>(null)
  const [processingNote, setProcessingNote] = useState('')
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    search: ''
  })

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (!user.is_admin) {
      router.replace('/dashboard')
      return
    }

    fetchPayouts()
  }, [user, router])

  useEffect(() => {
    // Apply filters
    let filtered = payouts

    if (filters.status !== 'all') {
      filtered = filtered.filter(payout => payout.status === filters.status)
    }

    if (filters.method !== 'all') {
      filtered = filtered.filter(payout => payout.method === filters.method)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(payout => 
        payout.user.first_name?.toLowerCase().includes(searchLower) ||
        payout.user.last_name?.toLowerCase().includes(searchLower) ||
        payout.user.email.toLowerCase().includes(searchLower)
      )
    }

    setFilteredPayouts(filtered)
  }, [payouts, filters])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('payout_requests')
        .select(`
          *,
          users!payout_requests_affiliate_id_fkey(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to flatten the user object
      const transformedPayouts = (data || []).map(payout => ({
        ...payout,
        user: payout.users
      }))

      setPayouts(transformedPayouts)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayout = async (payoutId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingPayout(payoutId)
      setError('')

      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: status,
          note: processingNote || undefined
        })
        .eq('id', payoutId)

      if (error) throw error

      // If approved, mark the user's leads as paid
      if (status === 'approved') {
        const payout = payouts.find(p => p.id === payoutId)
        if (payout) {
          // Get all unpaid approved leads for this user
          const { data: unpaidLeads } = await supabase
            .from('leads')
            .select('id, price')
            .eq('affiliate_id', payout.affiliate_id)
            .eq('status', 'approved')
            .eq('paid', false)

          if (unpaidLeads && unpaidLeads.length > 0) {
            // Mark leads as paid (up to the payout amount)
            let remainingAmount = payout.amount
            const leadsToMark = []

            for (const lead of unpaidLeads) {
              if (remainingAmount >= (lead.price || 0)) {
                leadsToMark.push(lead.id)
                remainingAmount -= (lead.price || 0)
              } else {
                break
              }
            }

            if (leadsToMark.length > 0) {
              await supabase
                .from('leads')
                .update({ paid: true })
                .in('id', leadsToMark)
            }
          }
        }
      }

      // Update local state
      setPayouts(prev => prev.map(payout => 
        payout.id === payoutId ? {
          ...payout,
          status: status,
          note: processingNote || undefined
        } : payout
      ))

      setProcessingPayout(null)
      setProcessingNote('')
      
      console.log(`Payout ${status} successfully!`)
      
    } catch (error: any) {
      setError(error.message)
      setProcessingPayout(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="secondary">Pending</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'paypal': return 'PayPal'
      case 'wise': return 'Wise'
      case 'bank_transfer': return 'Bank Transfer'
      default: return method
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-600">Process payout requests from affiliates</p>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts.length}</div>
              <p className="text-xs text-muted-foreground">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payouts.filter(p => p.status === 'requested').length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payouts.reduce((sum, p) => sum + p.amount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">All requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payouts.filter(p => p.status === 'requested').reduce((sum, p) => sum + p.amount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">To be processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by user name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="requested">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Method</label>
                <select
                  value={filters.method}
                  onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Methods</option>
                  <option value="paypal">PayPal</option>
                  <option value="wise">Wise</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Requests ({filteredPayouts.length})</CardTitle>
            <CardDescription>
              Review and process payout requests from affiliates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payout requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayouts.map((payout) => (
                  <div key={payout.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payout.status)}
                        <div>
                          <div className="font-medium">
                            {payout.user.first_name} {payout.user.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{payout.user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${payout.amount}</div>
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Method:</span> {getMethodLabel(payout.method)}
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span> {formatDate(payout.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Details:</span> {JSON.stringify(payout.details)}
                      </div>
                    </div>

                    {payout.note && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <div className="font-medium text-sm">Admin Note:</div>
                        <div className="text-sm text-gray-600">{payout.note}</div>
                      </div>
                    )}

                    {payout.status === 'requested' && (
                      <div className="border-t pt-4">
                        <div className="mb-3">
                          <label className="text-sm font-medium">Processing Note (Optional)</label>
                          <Textarea
                            placeholder="Add a note about this payout..."
                            value={processingNote}
                            onChange={(e) => setProcessingNote(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleProcessPayout(payout.id, 'approved')}
                            disabled={processingPayout === payout.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingPayout === payout.id ? 'Processing...' : 'Approve Payout'}
                          </Button>
                          <Button
                            onClick={() => handleProcessPayout(payout.id, 'rejected')}
                            disabled={processingPayout === payout.id}
                            variant="destructive"
                          >
                            {processingPayout === payout.id ? 'Processing...' : 'Reject Payout'}
                          </Button>
                        </div>
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
    </AdminLayout>
  )
} 