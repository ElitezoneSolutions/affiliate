'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardNav } from '@/components/dashboard-nav'
import { PaymentMethodsManager } from '@/components/payment-methods-manager'
import { 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

export default function PayoutSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.is_admin) {
      router.replace('/admin/leads')
      return
    }
  }, [user, router])

  const handleUpdate = () => {
    setMessage({ type: 'success', text: 'Payment settings updated successfully!' })
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payout Settings</h1>
              <p className="text-gray-600">Manage your payment methods for payouts</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
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

        {/* Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Payment Methods Information
            </CardTitle>
            <CardDescription>
              Configure how you want to receive your payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">💳</div>
                  <h3 className="font-medium text-blue-900">PayPal</h3>
                  <p className="text-sm text-blue-700">Fast and secure payments</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🌍</div>
                  <h3 className="font-medium text-green-900">Wise</h3>
                  <p className="text-sm text-green-700">International transfers</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">🏦</div>
                  <h3 className="font-medium text-purple-900">Bank Transfer</h3>
                  <p className="text-sm text-purple-700">Direct to your bank account</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Important Notes</h4>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                      <li>• You can add multiple payment methods and set one as default</li>
                      <li>• Minimum payout amount is $100</li>
                      <li>• Payouts are processed within 3-5 business days</li>
                      <li>• Make sure your payment details are accurate to avoid delays</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Manager */}
        <PaymentMethodsManager userId={user?.id || ''} onUpdate={handleUpdate} />
      </div>
    </div>
  )
} 