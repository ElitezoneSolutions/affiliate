'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  Trash2
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
  payout_method?: string
  payout_details?: any
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
  price: number
  created_at: string
  paid: boolean
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
    is_suspended: false,
    payout_method: '',
    payout_details: ''
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
        is_suspended: user.is_suspended || false,
        payout_method: user.payout_method || '',
        payout_details: user.payout_details || ''
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
          is_suspended: editForm.is_suspended,
          payout_method: editForm.payout_method,
          payout_details: editForm.payout_details
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      router.replace('/admin/users')
    } catch (error: any) {
      setError(error.message)
      setSaving(false)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!userDetails) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>User not found</AlertDescription>
            </Alert>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/admin/users">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Users
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userDetails.first_name} {userDetails.last_name}
            </h1>
            <p className="text-gray-600">User Details & Performance</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* User Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {userDetails.profile_image ? (
                      <Image 
                        src={userDetails.profile_image} 
                        alt="Profile" 
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {userDetails.first_name} {userDetails.last_name}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={userDetails.is_admin ? "default" : "secondary"}>
                        {userDetails.is_admin ? 'Admin' : 'Affiliate'}
                      </Badge>
                      {userDetails.is_suspended && (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
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

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Payout Method</label>
                    <Select 
                      value={editForm.payout_method} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, payout_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="wise">Wise</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Payout Details</label>
                    <Textarea
                      value={editForm.payout_details}
                      onChange={(e) => setEditForm(prev => ({ ...prev, payout_details: e.target.value }))}
                      rows={3}
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

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userStats.total_leads}</div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{userStats.approved_leads}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{userStats.pending_leads}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{userStats.rejected_leads}</div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Leads
                  </CardTitle>
                  <CardDescription>
                    Latest leads submitted by this user
                  </CardDescription>
                </div>
                <Link href={`/admin/users/${userId}/leads`}>
                  <Button variant="outline" size="sm">
                    View All Leads
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No leads submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{lead.full_name}</div>
                        <div className="text-sm text-gray-600">{lead.program}</div>
                        <div className="text-xs text-gray-500">{formatDate(lead.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">${lead.price || 0}</div>
                          {getStatusBadge(lead.status)}
                        </div>
                        {lead.paid && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Paid
                          </Badge>
                        )}
                      </div>
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