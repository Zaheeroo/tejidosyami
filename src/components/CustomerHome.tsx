'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUserOrders } from '@/lib/services/order-service'

export default function CustomerHome() {
  const { user } = useAuth()
  const [orderCount, setOrderCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderCount = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        const orders = await getUserOrders(user.id)
        setOrderCount(orders.length)
      } catch (error) {
        console.error('Error fetching order count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchOrderCount()
    }
  }, [user])

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.email?.split('@')[0] || 'customer'}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <h2 className="text-lg font-medium mb-2">My Orders</h2>
              <div className="text-4xl font-bold mb-2">{isLoading ? '...' : orderCount}</div>
              <p className="text-gray-500 mb-4">View your order history</p>
              <Link href="/customer/orders">
                <Button variant="outline">View Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <h2 className="text-lg font-medium mb-2">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/products">
                  <Button className="w-full">Browse Products</Button>
                </Link>
                <Link href="/customer/dashboard">
                  <Button variant="outline" className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 