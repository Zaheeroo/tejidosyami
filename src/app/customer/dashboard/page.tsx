'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function CustomerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is not loading and either not logged in or not a customer, redirect to home
    if (!loading && (!user || !isCustomer(user))) {
      toast.error('You need to be logged in as a customer to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  // Don't render anything while checking authentication
  if (loading || !user || !isCustomer(user)) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Customer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View and edit your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Email: {user.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Update your personal information and preferences.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>Track your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Recent orders: 0</p>
              <p className="text-sm text-gray-500 mt-2">
                View your order history and track current orders.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Wishlist</CardTitle>
              <CardDescription>Products you're interested in</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Items in wishlist: 0</p>
              <p className="text-sm text-gray-500 mt-2">
                Save products you're interested in for later.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>Get help with your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contact our support team for assistance.</p>
              <p className="text-sm text-gray-500 mt-2">
                We're here to help with any questions or issues.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
} 