'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getOrders, Order, updateOrderStatus } from '@/lib/services/order-service'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Create a Badge component since we don't have access to the shadcn Badge component
const Badge = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode, 
  className?: string 
}) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${className}`}>
      {children}
    </span>
  )
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If user is not loading and either not logged in or not an admin, redirect to home
    if (!loading && (!user || !isAdmin(user))) {
      toast.error('You do not have permission to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadOrders() {
      if (user && isAdmin(user)) {
        try {
          setIsLoading(true)
          const ordersData = await getOrders()
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
  if (loading || !user || !isAdmin(user)) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>
      case 'shipped':
        return <Badge className="bg-purple-500">Shipped</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>
      case 'refunded':
        return <Badge className="bg-orange-500">Refunded</Badge>
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status)
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ))
      toast.success(`Order status updated to ${status}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                <p className="text-gray-500 text-center max-w-md">
                  There are no customer orders in the system yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
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
                        <TableCell>{order.user_id.substring(0, 8)}...</TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'processing')}
                              disabled={order.status === 'processing'}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Process
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              disabled={order.status === 'shipped'}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Ship
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'completed')}
                              disabled={order.status === 'completed'}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              disabled={order.status === 'cancelled'}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
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