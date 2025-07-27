'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react'

export default function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'no-tables'>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      setStatus('checking')
      setError('')

      // Test basic connection
      const { data, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (connectionError) {
        if (connectionError.code === '42P01' || connectionError.message.includes('relation "users" does not exist')) {
          setStatus('no-tables')
          setError('Database connected but tables not created. Please run the SQL setup script.')
        } else {
          setStatus('error')
          setError(connectionError.message)
        }
      } else {
        setStatus('connected')
      }
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Unknown error')
    }
  }

  if (status === 'checking') {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>Checking database connection...</AlertDescription>
      </Alert>
    )
  }

  if (status === 'connected') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Database connected and tables exist! ✅
        </AlertDescription>
      </Alert>
    )
  }

  if (status === 'no-tables') {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-2">
            <p>Database connected but tables not created.</p>
            <div className="text-sm">
              <p><strong>To fix this:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Run the complete SQL setup script</li>
              </ol>
            </div>
            <Button size="sm" onClick={checkDatabase} className="mt-2">
              Check Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p>Database connection error: {error}</p>
          <Button size="sm" onClick={checkDatabase}>
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
} 