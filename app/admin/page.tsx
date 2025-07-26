'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  CreditCard,
  Settings,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin-layout'
import { LoadingSpinner } from '@/components/loading-spinner'

interface UserStats {
  id: string
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
  total_leads: number
  approved_leads: number
  total_earnings: number
  unpaid_earnings: number
  last_activity: string
}

interface DashboardStats {
  total_users: number
  total_leads: number
  pending_leads: number
  approved_leads: number
  total_payouts: number
  pending_payouts: number
  total_earnings: number
  unpaid_earnings: number
}

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_leads: 0,
    pending_leads: 0,
    approved_leads: 0,
    total_payouts: 0,
    pending_payouts: 0,
    total_earnings: 0,
    unpaid_earnings: 0
  })
  const [topUsers, setTopUsers] = useState<UserStats[]>([])

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (!user.is_admin) {
      router.replace('/dashboard')
      return
    }

    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch overall statistics
      const [
        { data: users, error: usersError },
        { data: leads, error: leadsError },
        { data: payouts, error: payoutsError }
      ] = await Promise.all([
        supabase.from('users').select('id, is_admin'),
        supabase.from('leads').select('status, price, paid'),
        supabase.from('payout_requests').select('status, amount')
      ])

      if (usersError) throw usersError
      if (leadsError) throw leadsError
      if (payoutsError) throw payoutsError

      // Calculate statistics
      const totalUsers = users?.length || 0
      const totalLeads = leads?.length || 0
      const pendingLeads = leads?.filter(l => l.status === 'pending').length || 0
      const approvedLeads = leads?.filter(l => l.status === 'approved').length || 0
      const totalEarnings = leads?.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.price || 0), 0) || 0
      const unpaidEarnings = leads?.filter(l => l.status === 'approved' && !l.paid).reduce((sum, l) => sum + (l.price || 0), 0) || 0
      const totalPayouts = payouts?.length || 0
      const pendingPayouts = payouts?.filter(p => p.status === 'requested').length || 0

      setStats({
        total_users: totalUsers,
        total_leads: totalLeads,
        pending_leads: pendingLeads,
        approved_leads: approvedLeads,
        total_payouts: totalPayouts,
        pending_payouts: pendingPayouts,
        total_earnings: totalEarnings,
        unpaid_earnings: unpaidEarnings
      })

      // Fetch top users with their statistics
      const { data: userStats, error: userStatsError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          is_admin,
          created_at
        `)
        .eq('is_admin', false)
        .order('created_at', { ascending: false })

      if (userStatsError) throw userStatsError

      // Get detailed stats for each user
      const usersWithStats = await Promise.all(
        (userStats || []).map(async (user) => {
          const { data: userLeads } = await supabase
            .from('leads')
            .select('status, price, paid')
            .eq('affiliate_id', user.id)

          const totalLeads = userLeads?.length || 0
          const approvedLeads = userLeads?.filter(l => l.status === 'approved').length || 0
          const totalEarnings = userLeads?.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.price || 0), 0) || 0
          const unpaidEarnings = userLeads?.filter(l => l.status === 'approved' && !l.paid).reduce((sum, l) => sum + (l.price || 0), 0) || 0

          return {
            ...user,
            total_leads: totalLeads,
            approved_leads: approvedLeads,
            total_earnings: totalEarnings,
            unpaid_earnings: unpaidEarnings,
            last_activity: user.created_at
          }
        })
      )

      // Sort by total earnings and take top 10
      const topUsersSorted = usersWithStats
        .sort((a, b) => b.total_earnings - a.total_earnings)
        .slice(0, 10)

      setTopUsers(topUsersSorted)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/')
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">Registered affiliates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_leads}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pending_leads} pending, {stats.approved_leads} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_earnings}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.unpaid_earnings} unpaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_payouts}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/leads">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Manage Leads
                </CardTitle>
                <CardDescription>
                  Review, approve, and manage all submitted leads
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View all users, their earnings, and manage accounts
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payout Management
                </CardTitle>
                <CardDescription>
                  Process payout requests and manage payments
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Top Performing Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Users
            </CardTitle>
            <CardDescription>
              Users with the highest earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Total Leads</th>
                      <th className="text-left py-3 px-4 font-medium">Approved</th>
                      <th className="text-left py-3 px-4 font-medium">Total Earnings</th>
                      <th className="text-left py-3 px-4 font-medium">Unpaid</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{user.total_leads}</td>
                        <td className="py-3 px-4">{user.approved_leads}</td>
                        <td className="py-3 px-4 font-medium">${user.total_earnings}</td>
                        <td className="py-3 px-4">${user.unpaid_earnings}</td>
                        <td className="py-3 px-4">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  )
} 