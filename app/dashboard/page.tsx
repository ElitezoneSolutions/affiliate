'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase, Lead } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardNav } from '@/components/dashboard-nav'
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Plus, 
  LogOut,
  Settings,
  CreditCard,
  User
} from 'lucide-react'
import Link from 'next/link'
import { LeadDetailsModal } from '@/components/lead-details-modal'

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalEarnings: 0,
    unpaidEarnings: 0
  })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('affiliate_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.code === '42P01' || error.message.includes('relation "leads" does not exist')) {
          setLeads([])
          setStats({
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
            totalEarnings: 0,
            unpaidEarnings: 0
          })
          setLeadsLoading(false)
          return
        }
        
        throw error
      }

      setLeads(data || [])

      // Calculate stats
      const total = data?.length || 0
      const approved = data?.filter(lead => lead.status === 'approved').length || 0
      const pending = data?.filter(lead => lead.status === 'pending').length || 0
      const rejected = data?.filter(lead => lead.status === 'rejected').length || 0
      const totalEarnings = data?.reduce((sum, lead) => 
        lead.status === 'approved' ? sum + (lead.price || 0) : sum, 0) || 0
      const unpaidEarnings = data?.reduce((sum, lead) => 
        lead.status === 'approved' && !lead.paid ? sum + (lead.price || 0) : sum, 0) || 0

      setStats({
        total,
        approved,
        pending,
        rejected,
        totalEarnings,
        unpaidEarnings
      })
    } catch (error) {
      // Handle error silently for now
    } finally {
      setLeadsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    // Don't do anything if still loading
    if (loading) {
      console.log('⏳ Dashboard: Still loading, waiting...')
      return
    }

    console.log('🔍 Dashboard: Checking authentication state...')
    console.log('User:', user?.email)
    console.log('Loading:', loading)

    // If user is admin, redirect to admin panel
    if (user?.is_admin) {
      console.log('👑 Dashboard: User is admin, redirecting to admin panel')
      router.replace('/admin/leads')
      return
    }

    // If we have a user, fetch leads
    if (user) {
      console.log('✅ Dashboard: User authenticated, fetching leads')
      fetchLeads()
    }
  }, [user, loading, router, fetchLeads])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading only for a short time
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if no user after loading is complete
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access your dashboard.</p>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show dashboard content even if leads are still loading
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsLoading ? '...' : stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Leads</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leadsLoading ? '...' : stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leadsLoading ? '...' : `$${stats.totalEarnings}`}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Earnings</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{leadsLoading ? '...' : `$${stats.unpaidEarnings}`}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/submit-lead">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <CardTitle>Submit New Lead</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit a new qualified lead to earn money
                </CardDescription>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/payouts">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <CardTitle>Request Payout</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Request payout when you reach $100 in earnings
                </CardDescription>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/payout-settings">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <CardTitle>Payout Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Configure your payment method and details
                </CardDescription>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Link href="/dashboard/leads">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leads submitted yet</p>
                <Link href="/submit-lead">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Lead
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.slice(0, 5).map((lead) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div>
                      <h3 className="font-medium">{lead.full_name}</h3>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                      <p className="text-sm text-gray-600">{lead.program}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        lead.status === 'approved' ? 'default' :
                        lead.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {lead.status}
                      </Badge>
                      {lead.status === 'approved' && lead.price && (
                        <span className="text-green-600 font-medium">${lead.price}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Details Modal */}
        {selectedLead && (
          <LeadDetailsModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={() => {
              fetchLeads()
              setSelectedLead(null)
            }}
          />
        )}
      </div>
    </div>
  )
}