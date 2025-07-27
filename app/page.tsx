'use client'

import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import DatabaseStatus from '@/components/database-status'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const redirectPath = user.is_admin ? '/admin/leads' : '/dashboard'
      router.replace(redirectPath)
    }
  }, [user, loading, router])

  // Show loading only for a short time, then show main content
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleCardClick = (path: string) => () => router.push(path)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            TrendHijacking
            <span className="text-blue-600"> Affiliate Program</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Submit qualified leads, track your earnings, and request payouts. 
            Join our affiliate program and start earning today.
          </p>
        </div>

        {/* Database Status */}
        <div className="max-w-2xl mx-auto mb-8">
          <DatabaseStatus />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={handleCardClick('/login')}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Sign In</CardTitle>
                  <CardDescription>
                    Welcome back! Sign in to your affiliate account
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button size="lg" className="w-full">
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={handleCardClick('/signup')}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Join Program</CardTitle>
                  <CardDescription>
                    Create a new affiliate account and start earning
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="lg" className="w-full">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 