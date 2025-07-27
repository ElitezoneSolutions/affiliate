'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Database } from 'lucide-react'

interface DatabaseTestProps {
  userId: string
}

export function DatabaseTest({ userId }: DatabaseTestProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const testDatabaseConnection = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Test 1: Check if users table exists and has payout_methods column
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, payout_methods, default_payout_method')
        .eq('id', userId)
        .single()

      if (userError) {
        throw new Error(`User query error: ${userError.message}`)
      }

      // Test 2: Try to update payout_methods
      const testMethod = {
        id: 'test_' + Date.now(),
        type: 'paypal' as const,
        name: 'Test PayPal',
        is_default: true,
        details: {
          paypal: {
            email: 'test@example.com'
          }
        },
        created_at: new Date().toISOString()
      }

      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          payout_methods: [testMethod],
          default_payout_method: 'paypal'
        })
        .eq('id', userId)
        .select()

      if (updateError) {
        throw new Error(`Update error: ${updateError.message}`)
      }

      setResult({
        userData,
        updateData,
        testMethod
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Test
        </CardTitle>
        <CardDescription>
          Test the payout_methods functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDatabaseConnection} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p><strong>Database test successful!</strong></p>
                <details className="text-sm">
                  <summary className="cursor-pointer">View test results</summary>
                  <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 