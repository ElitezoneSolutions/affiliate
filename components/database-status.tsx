'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Users,
  FileText,
  CreditCard
} from 'lucide-react'

interface DatabaseStatus {
  connected: boolean
  tables: {
    users: boolean
    leads: boolean
    payout_requests: boolean
  }
  error?: string
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    tables: {
      users: false,
      leads: false,
      payout_requests: false
    }
  })
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkDatabaseStatus = useCallback(async () => {
    try {
      setLoading(true)
      setStatus(prev => ({ ...prev, error: undefined }))

      // Test connection
      const { data, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (connectionError) {
        // Check if it's a table doesn't exist error vs connection error
        if (connectionError.code === '42P01') {
          setStatus({
            connected: true,
            tables: {
              users: false,
              leads: false,
              payout_requests: false
            },
            error: 'Database connected but tables not set up. Run the SQL setup script.'
          })
        } else {
          setStatus({
            connected: false,
            tables: {
              users: false,
              leads: false,
              payout_requests: false
            },
            error: connectionError.message
          })
        }
        return
      }

      // Check each table
      const tableChecks = await Promise.allSettled([
        supabase.from('users').select('count').limit(1),
        supabase.from('leads').select('count').limit(1),
        supabase.from('payout_requests').select('count').limit(1)
      ])

      const tables = {
        users: tableChecks[0].status === 'fulfilled',
        leads: tableChecks[1].status === 'fulfilled',
        payout_requests: tableChecks[2].status === 'fulfilled'
      }

      setStatus({
        connected: true,
        tables,
        error: undefined
      })

    } catch (error: any) {
      setStatus({
        connected: false,
        tables: {
          users: false,
          leads: false,
          payout_requests: false
        },
        error: error.message
      })
    } finally {
      setLoading(false)
      setLastChecked(new Date())
    }
  }, [])

  useEffect(() => {
    checkDatabaseStatus()
  }, [checkDatabaseStatus])

  const allTablesExist = status.tables.users && status.tables.leads && status.tables.payout_requests
  const isReady = status.connected && allTablesExist

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Status
        </CardTitle>
        <CardDescription>
          Current database connection and table status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Connection:</span>
            {status.connected ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
          <Button
            onClick={checkDatabaseStatus}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Table Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Tables:</span>
            {isReady ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Ready
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>Users</span>
              {status.tables.users ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>Leads</span>
              {status.tables.leads ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Payouts</span>
              {status.tables.payout_requests ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {/* Setup Instructions */}
        {status.connected && !allTablesExist && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Database is connected but tables need to be set up.</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Run the <code className="bg-gray-100 px-1 rounded">scripts/setup-database.sql</code> script</li>
                  <li>Refresh this page to verify setup</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Last Checked */}
        {lastChecked && (
          <div className="text-xs text-gray-500 text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 