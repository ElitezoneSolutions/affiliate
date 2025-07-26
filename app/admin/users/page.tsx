'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Search, 
  Filter, 
  DollarSign,
  FileText,
  Calendar,
  Eye,
  LogOut,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin-layout'

interface UserWithStats {
  id: string
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
  created_at: string
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

export default function AdminUsersPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    hasEarnings: 'all'
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

    fetchUsers()
  }, [user, router])

  useEffect(() => {
    // Apply filters
    let filtered = users

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => 
        filters.role === 'admin' ? user.is_admin : !user.is_admin
      )
    }

    if (filters.hasEarnings !== 'all') {
      filtered = filtered.filter(user => 
        filters.hasEarnings === 'yes' ? user.total_earnings > 0 : user.total_earnings === 0
      )
    }

    setFilteredUsers(filtered)
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch all users
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Get detailed stats for each user
      const usersWithStats = await Promise.all(
        (allUsers || []).map(async (user) => {
          // Get user's leads
          const { data: userLeads } = await supabase
            .from('leads')
            .select('status, price, paid, created_at')
            .eq('affiliate_id', user.id)
            .order('created_at', { ascending: false })

          // Get user's payout requests
          const { data: userPayouts } = await supabase
            .from('payout_requests')
            .select('id')
            .eq('affiliate_id', user.id)

          const totalLeads = userLeads?.length || 0
          const approvedLeads = userLeads?.filter(l => l.status === 'approved').length || 0
          const pendingLeads = userLeads?.filter(l => l.status === 'pending').length || 0
          const rejectedLeads = userLeads?.filter(l => l.status === 'rejected').length || 0
          const totalEarnings = userLeads?.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.price || 0), 0) || 0
          const paidEarnings = userLeads?.filter(l => l.status === 'approved' && l.paid).reduce((sum, l) => sum + (l.price || 0), 0) || 0
          const unpaidEarnings = totalEarnings - paidEarnings
          const lastLeadDate = userLeads?.[0]?.created_at

          return {
            ...user,
            total_leads: totalLeads,
            approved_leads: approvedLeads,
            pending_leads: pendingLeads,
            rejected_leads: rejectedLeads,
            total_earnings: totalEarnings,
            unpaid_earnings: unpaidEarnings,
            paid_earnings: paidEarnings,
            payout_requests: userPayouts?.length || 0,
            last_lead_date: lastLeadDate
          }
        })
      )

      setUsers(usersWithStats)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users and view their performance</p>
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => !u.is_admin).length} affiliates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.total_leads > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">With submitted leads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${users.reduce((sum, u) => sum + u.total_earnings, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                ${users.reduce((sum, u) => sum + u.unpaid_earnings, 0)} unpaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.total_earnings, 0) / users.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per user</p>
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
                <label className="text-sm font-medium">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins Only</option>
                  <option value="user">Affiliates Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Earnings</label>
                <select
                  value={filters.hasEarnings}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasEarnings: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Users</option>
                  <option value="yes">With Earnings</option>
                  <option value="no">No Earnings</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Detailed view of all users and their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found matching your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Leads</th>
                      <th className="text-left py-3 px-4 font-medium">Earnings</th>
                      <th className="text-left py-3 px-4 font-medium">Payouts</th>
                      <th className="text-left py-3 px-4 font-medium">Joined</th>
                      <th className="text-left py-3 px-4 font-medium">Last Activity</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.is_admin ? "default" : "secondary"}>
                            {user.is_admin ? 'Admin' : 'Affiliate'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>Total: {user.total_leads}</div>
                            <div className="text-green-600">✓ {user.approved_leads}</div>
                            <div className="text-yellow-600">⏳ {user.pending_leads}</div>
                            <div className="text-red-600">✗ {user.rejected_leads}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">${user.total_earnings}</div>
                            <div className="text-green-600">Paid: ${user.paid_earnings}</div>
                            <div className="text-orange-600">Unpaid: ${user.unpaid_earnings}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {user.payout_requests} requests
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {user.last_lead_date ? formatDate(user.last_lead_date) : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/admin/users/${user.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/users/${user.id}/leads`}>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                Leads
                              </Button>
                            </Link>
                          </div>
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