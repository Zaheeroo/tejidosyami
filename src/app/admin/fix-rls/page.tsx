'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, Shield, RefreshCcw } from 'lucide-react'

export default function FixRLSPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const updateRLSPolicies = async () => {
    try {
      setIsUpdating(true)
      setResult(null)
      
      const response = await fetch('/api/update-rls-policy')
      const data = await response.json()
      
      setResult(data)
      
      if (data.success) {
        toast.success('RLS policies updated successfully')
      } else {
        toast.error(`Failed to update RLS policies: ${data.error}`)
      }
    } catch (error: any) {
      console.error('Error updating RLS policies:', error)
      toast.error(`Error: ${error.message}`)
      setResult({ success: false, error: error.message })
    } finally {
      setIsUpdating(false)
    }
  }

  // Don't render anything while checking authentication
  if (loading) {
    return null
  }

  // Redirect non-admin users
  if (!user || !isAdmin(user)) {
    router.push('/')
    return null
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Fix RLS Policies</h1>
          <p className="text-gray-500 mt-2">Update Row Level Security policies for the orders table</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              RLS Policy Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <p className="font-medium">Warning</p>
                <p className="text-sm">
                  This will update the Row Level Security (RLS) policies for the orders table. 
                  This is needed to fix issues with creating and viewing orders.
                </p>
              </div>
              
              <Button 
                onClick={updateRLSPolicies} 
                disabled={isUpdating}
                className="flex items-center"
              >
                {isUpdating ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Updating Policies...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Update RLS Policies
                  </>
                )}
              </Button>
              
              {result && (
                <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  <p className="font-medium">{result.success ? 'Success' : 'Error'}</p>
                  <p className="text-sm">{result.success ? result.message : result.error}</p>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">What will be updated:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Add policies for admins to view all orders</li>
                  <li>Add policies for admins to insert orders</li>
                  <li>Add policies for admins to update orders</li>
                  <li>Add policies for service role to manage all orders</li>
                  <li>Maintain existing policies for users to view/manage their own orders</li>
                </ul>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/admin/orders')}
                >
                  Go to Orders
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/test-orders')}
                >
                  Test Orders Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
} 