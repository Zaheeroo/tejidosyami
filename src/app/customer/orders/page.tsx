'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag, ExternalLink } from 'lucide-react'
import { getUserOrders, Order } from '@/lib/services/order-service'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'

// Create a Badge component since we don't have access to the shadcn Badge component
const Badge = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode, 
  className?: string 
}) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

export default function CustomerOrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If user is not loading and either not logged in or not a customer, redirect to home
    if (!loading && (!user || !isCustomer(user))) {
      toast.error('You need to be logged in as a customer to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadOrders() {
      if (user && isCustomer(user)) {
        try {
          setIsLoading(true)
          const ordersData = await getUserOrders(user.id)
          setOrders(ordersData)
        } catch (error) {
          console.error('Error loading orders:', error)
          toast.error('Failed to load orders')
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (user && !loading) {
      loadOrders()
    }
  }, [user, loading])

  // Don't render anything while checking authentication
  if (loading || !user || !isCustomer(user)) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-500 text-white">Processing</Badge>
      case 'shipped':
        return <Badge className="bg-purple-500 text-white">Shipped</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      default:
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">Paid</Badge>
      case 'refunded':
        return <Badge className="bg-orange-500 text-white">Refunded</Badge>
      case 'failed':
        return <Badge className="bg-red-500 text-white">Failed</Badge>
      default:
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>
    }
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/customer/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-gray-500 mt-2">View and track your orders</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Link href="/products">
                  <Button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at || '').toLocaleDateString()}
                        </TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/customer/orders/${order.id}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
} 