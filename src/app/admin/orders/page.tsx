'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag } from 'lucide-react'

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not loading and either not logged in or not an admin, redirect to home
    if (!loading && (!user || !isAdmin(user))) {
      toast.error('You do not have permission to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  // Don't render anything while checking authentication
  if (loading || !user || !isAdmin(user)) {
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
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-gray-500 mt-2">View and manage customer orders</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                The order management system is not yet implemented in this demo. 
                In a production environment, you would see a list of customer orders here.
              </p>
              <div className="text-sm text-gray-500 bg-gray-100 p-4 rounded-md">
                <p className="font-medium mb-2">Coming Soon:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Order listing with filtering and sorting</li>
                  <li>Order details with customer information</li>
                  <li>Order status management</li>
                  <li>Shipping and delivery tracking</li>
                  <li>Order history and analytics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
} 