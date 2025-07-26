'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin-layout'
import { LoadingSpinner } from '@/components/loading-spinner'

interface UserLead {
  id: string
  title: string
  description: string
  status: string
  price: number
  created_at: string
  paid: boolean
  affiliate_id: string
}

interface UserInfo {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function UserLeadsPage() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [leads, setLeads] = useState<UserLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<UserLead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingLead, setEditingLead] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    price: 0
  })

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login')
      return
    }

    if (!currentUser.is_admin) {
      router.replace('/dashboard')
      return
    }

    fetchUserLeads()
  }, [currentUser, router, userId])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, statusFilter])

  const fetchUserLeads = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch user info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setUserInfo(user)

      // Fetch user's leads
      const { data: userLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('affiliate_id', userId)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError
      setLeads(userLeads || [])

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = leads

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    setFilteredLeads(filtered)
  }

  const startEdit = (lead: UserLead) => {
    setEditingLead(lead.id)
    setEditForm({
      title: lead.title,
      description: lead.description,
      status: lead.status,
      price: lead.price
    })
  }

  const cancelEdit = () => {
    setEditingLead(null)
    setEditForm({
      title: '',
      description: '',
      status: '',
      price: 0
    })
  }

  const saveEdit = async (leadId: string) => {
    try {
      setError('')

      const { error } = await supabase
        .from('leads')
        .update({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          price: editForm.price
        })
        .eq('id', leadId)

      if (error) throw error

      // Refresh leads
      await fetchUserLeads()
      setEditingLead(null)
      setEditForm({
        title: '',
        description: '',
        status: '',
        price: 0
      })

    } catch (error: any) {
      setError(error.message)
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

  const getStats = () => {
    const total = leads.length
    const approved = leads.filter(l => l.status === 'approved').length
    const pending = leads.filter(l => l.status === 'pending').length
    const rejected = leads.filter(l => l.status === 'rejected').length
    const totalEarnings = leads.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.price || 0), 0)
    const paidEarnings = leads.filter(l => l.status === 'approved' && l.paid).reduce((sum, l) => sum + (l.price || 0), 0)

    return { total, approved, pending, rejected, totalEarnings, paidEarnings }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!userInfo) {
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

  const stats = getStats()

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/admin/users/${userId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to User Details
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userInfo.first_name} {userInfo.last_name}&apos;s Leads
            </h1>
            <p className="text-gray-600">Manage all leads submitted by this user</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Leads</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${stats.totalEarnings}</div>
                  <div className="text-sm text-gray-600">Total Earnings</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">${stats.paidEarnings}</div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
              <CardDescription>
                Manage and review all leads submitted by {userInfo.first_name} {userInfo.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No leads found matching your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} className="border rounded-lg p-4">
                      {editingLead === lead.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Title</label>
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Price</label>
                              <Input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => saveEdit(lead.id)}>Save</Button>
                            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(lead.status)}
                            <div>
                              <div className="font-medium">{lead.title}</div>
                              <div className="text-sm text-gray-600">{lead.description}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lead.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {lead.price}
                              </div>
                              {getStatusBadge(lead.status)}
                              {lead.paid && (
                                <Badge variant="default" className="bg-green-100 text-green-800 ml-2">
                                  Paid
                                </Badge>
                              )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => startEdit(lead)}>
                              Edit
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