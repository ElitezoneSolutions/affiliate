'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter, useParams } from 'next/navigation'
import { supabase, PaymentMethod } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  CreditCard,
  AlertCircle,
  User,
  FileText,
  Ban,
  Shield,
  Save,
  Trash2,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin-layout'
import { LoadingSpinner } from '@/components/loading-spinner'

interface UserDetails {
  id: string
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
  is_suspended: boolean
  created_at: string
  profile_image?: string
  default_payout_method?: string
  payout_methods?: PaymentMethod[]
}

interface UserStats {
  total_leads: number
  approved_leads: number
  pending_leads: number
  rejected_leads: number
  total_earnings: number
  unpaid_earnings: number
  paid_earnings: number
  payout_requests: number
  last_lead_date?: string
}

interface RecentLead {
  id: string
  full_name: string
  email: string
  program: string
  status: string
  price?: number
  created_at: string
}

export default function UserDetailsPage() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    is_admin: false,
    is_suspended: false
  })
  const [userStats, setUserStats] = useState<UserStats>({
    total_leads: 0,
    approved_leads: 0,
    pending_leads: 0,
    rejected_leads: 0,
    total_earnings: 0,
    unpaid_earnings: 0,
    paid_earnings: 0,
    payout_requests: 0
  })
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setUserDetails(user)
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        is_admin: user.is_admin || false,
        is_suspended: user.is_suspended || false
      })

      // Fetch user's leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('affiliate_id', userId)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      // Calculate statistics
      const totalLeads = leads?.length || 0
      const approvedLeads = leads?.filter(l => l.status === 'approved').length || 0
      const pendingLeads = leads?.filter(l => l.status === 'pending').length || 0
      const rejectedLeads = leads?.filter(l => l.status === 'rejected').length || 0
      const totalEarnings = leads?.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.price || 0), 0) || 0
      const paidEarnings = leads?.filter(l => l.status === 'approved' && l.paid).reduce((sum, l) => sum + (l.price || 0), 0) || 0
      const unpaidEarnings = totalEarnings - paidEarnings
      const lastLeadDate = leads?.[0]?.created_at

      // Fetch payout requests count
      const { count: payoutCount } = await supabase
        .from('payout_requests')
        .select('id', { count: 'exact' })
        .eq('affiliate_id', userId)

      setUserStats({
        total_leads: totalLeads,
        approved_leads: approvedLeads,
        pending_leads: pendingLeads,
        rejected_leads: rejectedLeads,
        total_earnings: totalEarnings,
        unpaid_earnings: unpaidEarnings,
        paid_earnings: paidEarnings,
        payout_requests: payoutCount || 0,
        last_lead_date: lastLeadDate
      })

      // Set recent leads (last 5)
      setRecentLeads(leads?.slice(0, 5) || [])

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login')
      return
    }

    if (!currentUser.is_admin) {
      router.replace('/dashboard')
      return
    }

    fetchUserDetails()
  }, [currentUser, router, userId, fetchUserDetails])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const { error } = await supabase
        .from('users')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          is_admin: editForm.is_admin,
          is_suspended: editForm.is_suspended
        })
        .eq('id', userId)

      if (error) throw error

      setSuccess('User details updated successfully')
      fetchUserDetails() // Refresh data
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal': return '💳'
      case 'wise': return '🌍'
      case 'bank_transfer': return '🏦'
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'paypal': return 'PayPal'
      case 'wise': return 'Wise'
      case 'bank_transfer': return 'Bank Transfer'
      default: return type
    }
  }

  const renderPaymentMethodDetails = (method: PaymentMethod) => {
    switch (method.type) {
      case 'paypal':
        return <span className="text-sm text-gray-600">{method.details.paypal?.email || 'Email not provided'}</span>
      case 'wise':
        return <span className="text-sm text-gray-600">{method.details.wise?.name || 'Name not provided'} ({method.details.wise?.email || 'Email not provided'})</span>
      case 'bank_transfer':
        return <span className="text-sm text-gray-600">{method.details.bank_transfer?.bank_name || 'Bank not provided'} - {method.details.bank_transfer?.iban?.slice(-4) || 'IBAN not provided'}</span>
      default:
        return <span className="text-sm text-gray-600">Unknown payment method</span>
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!userDetails) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User not found</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/admin/users" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Users
            </Link>
            <div className="flex items-center gap-4">
              {userDetails.profile_image && (
                <Image
                  src={userDetails.profile_image}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userDetails.first_name} {userDetails.last_name}
                </h1>
                <p className="text-gray-600">{userDetails.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {userDetails.is_admin && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {userDetails.is_suspended && (
                    <Badge variant="destructive">
                      <Ban className="h-3 w-3 mr-1" />
                      Suspended
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <CardDescription>Edit user details and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_admin}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Admin Access
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_suspended}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_suspended: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Ban className="h-4 w-4" />
                      Suspend Account
                    </label>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>User&apos;s configured payment methods</CardDescription>
                </CardHeader>
                <CardContent>
                  {userDetails.payout_methods && userDetails.payout_methods.length > 0 ? (
                    <div className="space-y-4">
                      {userDetails.payout_methods.map((method) => (
                        <div key={method.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getMethodIcon(method.type)}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{method.name}</h4>
                                  {method.is_default && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      <Star className="h-3 w-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{getMethodLabel(method.type)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm">
                            {renderPaymentMethodDetails(method)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No payment methods configured</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Leads */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>Latest lead submissions from this user</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentLeads.length > 0 ? (
                    <div className="space-y-4">
                      {recentLeads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{lead.full_name}</div>
                            <div className="text-sm text-gray-600">{lead.email}</div>
                            <div className="text-sm text-gray-600">{lead.program}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              lead.status === 'approved' ? 'default' :
                              lead.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {lead.status}
                            </Badge>
                            {lead.price && (
                              <div className="text-sm text-green-600 font-medium mt-1">${lead.price}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No leads submitted yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{userStats.total_leads}</div>
                      <div className="text-sm text-gray-600">Total Leads</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{userStats.approved_leads}</div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">${userStats.total_earnings}</div>
                      <div className="text-sm text-gray-600">Total Earnings</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">${userStats.paid_earnings}</div>
                      <div className="text-sm text-gray-600">Paid</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">${userStats.unpaid_earnings}</div>
                      <div className="text-sm text-gray-600">Unpaid</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm text-gray-600 mb-2">Activity Timeline</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Joined {formatDate(userDetails.created_at)}</span>
                      </div>
                      {userStats.last_lead_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Last Lead: {formatDate(userStats.last_lead_date)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span>Payout Requests: {userStats.payout_requests}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/admin/users/${userId}/leads`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View All Leads
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
} 