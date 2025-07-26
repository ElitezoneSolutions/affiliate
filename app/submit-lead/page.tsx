'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { DashboardNav } from '@/components/dashboard-nav'
import Link from 'next/link'

const PROGRAMS = [
  'The Smart Acquisition Program',
  'The Acquisition Partnership',
  'The Automation Program'
]

export default function SubmitLeadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    website: '',
    program: '',
    lead_note: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!user) {
      setError('You must be logged in to submit leads')
      setLoading(false)
      return
    }

    // Validate required fields
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!formData.program) {
      setError('Please select a program')
      setLoading(false)
      return
    }

    // Optional website validation if provided
    if (formData.website.trim() && !formData.website.trim().startsWith('http')) {
      setFormData(prev => ({
        ...prev,
        website: `https://${formData.website.trim()}`
      }))
    }

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          affiliate_id: user.id,
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          website: formData.website.trim() || null, // Set to null if empty
          program: formData.program,
          lead_note: formData.lead_note.trim(),
          status: 'pending',
          paid: false,
          call_requested: false
        })

      if (error) throw error

      setSuccess(true)
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        website: '',
        program: '',
        lead_note: ''
      })

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <DashboardNav />
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-green-600">Lead Submitted!</CardTitle>
                <CardDescription>
                  Your lead has been submitted successfully and is now under review. 
                  You will be notified once it&apos;s approved or rejected.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Redirecting to dashboard...
                </p>
                <Link href="/dashboard">
                  <Button variant="outline">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardNav />
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <CardTitle className="text-2xl">Submit New Lead</CardTitle>
              </div>
              <CardDescription>
                Submit a qualified business lead to earn money. All leads are reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="Lead's full name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Lead's email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Lead's phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="Lead's website URL (optional)"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program of Interest *</Label>
                  <Select value={formData.program} onValueChange={(value) => handleInputChange('program', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMS.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead_note">Additional Notes</Label>
                  <Textarea
                    id="lead_note"
                    placeholder="Any additional information about this lead..."
                    value={formData.lead_note}
                    onChange={(e) => handleInputChange('lead_note', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Lead Submission Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure the lead is interested in our services</li>
                    <li>• Provide accurate contact information</li>
                    <li>• Include relevant details in the notes section</li>
                    <li>• Leads are reviewed within 24-48 hours</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting Lead...' : 'Submit Lead'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 