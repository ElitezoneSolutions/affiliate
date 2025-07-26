'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase, Lead } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  Globe,
  Edit,
  Save,
  AlertCircle
} from 'lucide-react'
import { AdminLayout } from '@/components/admin-layout'

const PROGRAMS = [
  'The Smart Acquisition Program',
  'The Acquisition Partnership',
  'The Automation Program'
]

export default function AdminLeadsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLead, setEditingLead] = useState<string | null>(null)
  const [error, setError] = useState('')
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    callRequested: 'all',
    program: 'all',
    search: ''
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: '',
    price: '',
    admin_note: '',
    call_meeting_link: ''
  })

  const fetchLeads = useCallback(async () => {
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          users!leads_affiliate_id_fkey(email)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.callRequested !== 'all') {
        query = query.eq('call_requested', filters.callRequested === 'yes')
      }
      if (filters.program !== 'all') {
        query = query.eq('program', filters.program)
      }
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setLeads(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!user.is_admin) {
      router.push('/dashboard')
      return
    }

    fetchLeads()
  }, [user, router, fetchLeads])

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus as any } : lead
      ))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handlePriceUpdate = async (leadId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ price })
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, price } : lead
      ))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleCallRequest = async (leadId: string, meetingLink: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          call_meeting_link: meetingLink,
          call_requested: true
        })
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { 
          ...lead, 
          call_meeting_link: meetingLink,
          call_requested: true
        } : lead
      ))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const startEditing = (lead: Lead) => {
    setEditingLead(lead.id)
    setEditForm({
      status: lead.status,
      price: lead.price?.toString() || '',
      admin_note: lead.admin_note || '',
      call_meeting_link: lead.call_meeting_link || ''
    })
  }

  const saveEdit = async (leadId: string) => {
    try {
      setError('')
      
      const updates = {
        status: editForm.status as 'pending' | 'approved' | 'rejected',
        price: editForm.price ? parseFloat(editForm.price) : null,
        admin_note: editForm.admin_note,
        call_meeting_link: editForm.call_meeting_link
      }
      
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? {
          ...lead,
          status: updates.status,
          price: updates.price,
          admin_note: updates.admin_note,
          call_meeting_link: updates.call_meeting_link
        } : lead
      ))

      setEditingLead(null)
      setError('') // Clear any previous errors
      
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-yellow-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Review and manage all submitted leads</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Call Requested</Label>
                <Select value={filters.callRequested} onValueChange={(value) => setFilters(prev => ({ ...prev, callRequested: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={filters.program} onValueChange={(value) => setFilters(prev => ({ ...prev, program: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {PROGRAMS.map((program) => (
                      <SelectItem key={program} value={program}>{program}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button onClick={fetchLeads} className="mt-4">
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Leads List */}
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold">{lead.full_name}</h3>
                      <Badge variant={
                        lead.status === 'approved' ? 'default' :
                        lead.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {getStatusIcon(lead.status)}
                        <span className="ml-1">{lead.status}</span>
                      </Badge>
                      {lead.call_requested && (
                        <Badge variant="outline" className="text-orange-600">
                          Call Requested
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{lead.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{lead.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <p className="font-medium">{lead.website || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Program</p>
                        <p className="font-medium">{lead.program}</p>
                      </div>
                    </div>

                    {lead.lead_note && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Lead Note</p>
                        <p className="text-sm bg-gray-50 p-3 rounded">{lead.lead_note}</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <p>Affiliate: {(lead as any).users?.email}</p>
                      <p>Submitted: {new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="ml-6">
                    {editingLead === lead.id ? (
                      <div className="space-y-4 min-w-[300px]">
                        <div>
                          <Label>Status</Label>
                          <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
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

                        <div>
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label>Meeting Link</Label>
                          <Input
                            value={editForm.call_meeting_link}
                            onChange={(e) => setEditForm(prev => ({ ...prev, call_meeting_link: e.target.value }))}
                            placeholder="Zoom/Meet link"
                          />
                        </div>

                        <div>
                          <Label>Admin Note</Label>
                          <Textarea
                            value={editForm.admin_note}
                            onChange={(e) => setEditForm(prev => ({ ...prev, admin_note: e.target.value }))}
                            placeholder="Internal notes..."
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => saveEdit(lead.id)} size="sm">
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setEditingLead(null)} size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {lead.price && (
                          <p className="text-lg font-bold text-green-600">${lead.price}</p>
                        )}
                        <Button onClick={() => startEditing(lead)} size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {leads.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No leads found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>
    </AdminLayout>
  )
} 