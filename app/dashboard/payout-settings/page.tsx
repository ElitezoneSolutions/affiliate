'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardNav } from '@/components/dashboard-nav'
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Save
} from 'lucide-react'
import Link from 'next/link'

const PAYOUT_METHODS = [
  { value: 'paypal', label: 'PayPal', description: 'Fast and secure payments via PayPal' },
  { value: 'wise', label: 'Wise', description: 'International money transfers with low fees' },
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank transfer (IBAN/SWIFT)' }
]

export default function PayoutSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [payoutMethod, setPayoutMethod] = useState(user?.payout_method || '')
  const [payoutDetails, setPayoutDetails] = useState<{
    paypal: { email: string }
    wise: { name: string; email: string; account_id: string }
    bank_transfer: { name: string; iban: string; bank_name: string; swift: string }
  }>({
    paypal: { email: '' },
    wise: { name: '', email: '', account_id: '' },
    bank_transfer: { name: '', iban: '', bank_name: '', swift: '' }
  })

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.is_admin) {
      router.replace('/admin/leads')
      return
    }

    // Load existing payout settings
    if (user.payout_method) {
      setPayoutMethod(user.payout_method)
    }
    
    if (user.payout_details) {
      setPayoutDetails(prev => ({
        ...prev,
        ...user.payout_details
      }))
    }
  }, [user, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!payoutMethod) {
      setMessage({ type: 'error', text: 'Please select a payout method' })
      setLoading(false)
      return
    }

    // Validate required fields based on method
    let isValid = true
    let errorMessage = ''

    switch (payoutMethod) {
      case 'paypal':
        if (!payoutDetails.paypal.email) {
          isValid = false
          errorMessage = 'PayPal email is required'
        }
        break
      case 'wise':
        if (!payoutDetails.wise.name || !payoutDetails.wise.email) {
          isValid = false
          errorMessage = 'Name and email are required for Wise'
        }
        break
      case 'bank_transfer':
        if (!payoutDetails.bank_transfer.name || !payoutDetails.bank_transfer.iban || !payoutDetails.bank_transfer.bank_name) {
          isValid = false
          errorMessage = 'Name, IBAN, and Bank Name are required for bank transfer'
        }
        break
    }

    if (!isValid) {
      setMessage({ type: 'error', text: errorMessage })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          payout_method: payoutMethod,
          payout_details: payoutDetails
        })
        .eq('id', user?.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Payout settings saved successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const renderMethodFields = () => {
    switch (payoutMethod) {
      case 'paypal':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paypal_email">PayPal Email Address *</Label>
              <Input
                id="paypal_email"
                type="email"
                placeholder="your-email@example.com"
                value={payoutDetails.paypal.email}
                onChange={(e) => setPayoutDetails(prev => ({
                  ...prev,
                  paypal: { ...prev.paypal, email: e.target.value }
                }))}
                required
              />
              <p className="text-sm text-gray-600">
                Enter the email address associated with your PayPal account
              </p>
            </div>
          </div>
        )

      case 'wise':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wise_name">Full Name *</Label>
                <Input
                  id="wise_name"
                  placeholder="Your full name"
                  value={payoutDetails.wise.name}
                  onChange={(e) => setPayoutDetails(prev => ({
                    ...prev,
                    wise: { ...prev.wise, name: e.target.value }
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wise_email">Email Address *</Label>
                <Input
                  id="wise_email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={payoutDetails.wise.email}
                  onChange={(e) => setPayoutDetails(prev => ({
                    ...prev,
                    wise: { ...prev.wise, email: e.target.value }
                  }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wise_account">Wise Account ID (Optional)</Label>
              <Input
                id="wise_account"
                placeholder="Your Wise account ID"
                value={payoutDetails.wise.account_id}
                onChange={(e) => setPayoutDetails(prev => ({
                  ...prev,
                  wise: { ...prev.wise, account_id: e.target.value }
                }))}
              />
              <p className="text-sm text-gray-600">
                If you have a Wise account ID, include it for faster transfers
              </p>
            </div>
          </div>
        )

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Full Name *</Label>
              <Input
                id="bank_name"
                placeholder="Your full name"
                value={payoutDetails.bank_transfer.name}
                onChange={(e) => setPayoutDetails(prev => ({
                  ...prev,
                  bank_transfer: { ...prev.bank_transfer, name: e.target.value }
                }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_iban">IBAN *</Label>
                <Input
                  id="bank_iban"
                  placeholder="Your IBAN number"
                  value={payoutDetails.bank_transfer.iban}
                  onChange={(e) => setPayoutDetails(prev => ({
                    ...prev,
                    bank_transfer: { ...prev.bank_transfer, iban: e.target.value }
                  }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_swift">SWIFT/BIC Code</Label>
                <Input
                  id="bank_swift"
                  placeholder="Your SWIFT/BIC code"
                  value={payoutDetails.bank_transfer.swift}
                  onChange={(e) => setPayoutDetails(prev => ({
                    ...prev,
                    bank_transfer: { ...prev.bank_transfer, swift: e.target.value }
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_bank_name">Bank Name *</Label>
              <Input
                id="bank_bank_name"
                placeholder="Your bank name"
                value={payoutDetails.bank_transfer.bank_name}
                onChange={(e) => setPayoutDetails(prev => ({
                  ...prev,
                  bank_transfer: { ...prev.bank_transfer, bank_name: e.target.value }
                }))}
                required
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a payout method to configure</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payout Settings</h1>
          <p className="text-gray-600">Configure how you want to receive your payouts</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Payout Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payout Method
              </CardTitle>
              <CardDescription>
                Choose how you want to receive your payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="payout_method">Select Payout Method *</Label>
                  <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a payout method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYOUT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div>
                            <div className="font-medium">{method.label}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Method-specific fields */}
                {payoutMethod && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">
                      {PAYOUT_METHODS.find(m => m.value === payoutMethod)?.label} Details
                    </h3>
                    {renderMethodFields()}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading || !payoutMethod}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <Link href="/dashboard/payouts">
                    <Button variant="outline">
                      Back to Payouts
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payout Requirements</h4>
                  <ul className="space-y-1">
                    <li>• Minimum payout amount: $100</li>
                    <li>• Payouts are processed within 3-5 business days</li>
                    <li>• You can only have one active payout method at a time</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Security</h4>
                  <ul className="space-y-1">
                    <li>• Your payment details are encrypted and secure</li>
                    <li>• We never store sensitive banking information</li>
                    <li>• All payouts are processed through secure payment providers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 