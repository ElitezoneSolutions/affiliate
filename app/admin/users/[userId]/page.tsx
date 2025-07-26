'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  DollarSign, 
  FileText,
  CreditCard,
  Calendar,
  Mail,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
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
  title: string
  description: string
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
  const [error, setError] = useState('')
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
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
  }, [currentUser, router, userId])

  const fetchUserDetails = async () => {
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

      setUserStats({
        total_leads: totalLeads,
        approved_leads: approvedLeads,
        pending_leads: pendingLeads,
        rejected_leads: rejectedLeads,
        total_earnings: totalEarnings,
        unpaid_earnings: unpaidEarnings,
        paid_earnings: paidEarnings,
        payout_requests: 0, // TODO: Fetch from payout_requests table
        last_lead_date: lastLeadDate
      })

      // Set recent leads (last 5)
      setRecentLeads(leads?.slice(0, 5) || [])

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
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
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {userDetails.profile_image ? (
                      <img 
                        src={userDetails.profile_image} 
                        alt="Profile" 
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
                    <Badge variant={userDetails.is_admin ? "default" : "secondary"}>
                      {userDetails.is_admin ? 'Admin' : 'Affiliate'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{userDetails.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Joined {formatDate(userDetails.created_at)}</span>
                  </div>
                  {userDetails.payout_method && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>Payout: {userDetails.payout_method}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Performance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userStats.total_leads}</div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userStats.approved_leads}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{userStats.pending_leads}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center">
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
                      <div className="flex items-center gap-4">
                        {getStatusIcon(lead.status)}
                        <div>
                          <div className="font-medium">{lead.title}</div>
                          <div className="text-sm text-gray-600">{lead.description}</div>
                          <div className="text-xs text-gray-500">{formatDate(lead.created_at)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">${lead.price}</div>
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