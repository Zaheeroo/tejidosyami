'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminDashboard() {
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
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Total users: 0</p>
              <p className="text-sm text-gray-500 mt-2">
                View and manage all user accounts in the system.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage product inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Total products: 0</p>
              <p className="text-sm text-gray-500 mt-2">
                Add, edit, and remove products from your inventory.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Pending orders: 0</p>
              <p className="text-sm text-gray-500 mt-2">
                Process customer orders and manage shipping.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
} 