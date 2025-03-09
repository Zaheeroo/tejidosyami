'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag, Package, Clock, CheckCircle, XCircle, RefreshCcw, Shield } from 'lucide-react'
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
import { supabase } from '@/lib/supabase/supabase-client'

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
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // If user is not loading and either not logged in or not an admin, redirect to home
    if (!loading && (!user || !isAdmin(user))) {
      toast.error('You do not have permission to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  const loadOrders = async () => {
    if (user && isAdmin(user)) {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching orders...')
        
        // Try to get orders using the order service
        try {
          const ordersData = await getOrders()
          console.log('Orders from service:', ordersData)
          setOrders(ordersData)
        } catch (serviceError: any) {
          console.error('Error from order service:', serviceError)
          setError(`Service error: ${serviceError.message}`)
          
          // If the error is about the service role key, show a helpful message
          if (serviceError.message && serviceError.message.includes('supabaseKey')) {
            setError('Service role key is not available. Please visit the Fix RLS page to update the RLS policies.')
          }
        }
        
        // Also try to query the orders table directly
        try {
          const { data: directOrders, error: directError } = await supabase
            .from('orders')
            .select('*')
          
          console.log('Direct orders query:', directOrders)
          console.log('Direct query error:', directError)
          
          setDebugInfo({
            directOrders,
            directError: directError ? directError.message : null
          })
          
          // If service failed but direct query worked, use the direct query results
          if (error && directOrders && directOrders.length > 0) {
            setOrders(directOrders as Order[])
          }
        } catch (directQueryError: any) {
          console.error('Error querying orders directly:', directQueryError)
        }
      } catch (error: any) {
        console.error('Error loading orders:', error)
        toast.error('Failed to load orders')
        setError(`Error: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
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

  const createTestOrder = async () => {
    try {
      const response = await fetch('/api/create-test-order')
      const data = await response.json()
      
      if (data.success) {
        toast.success('Test order created successfully')
        loadOrders() // Reload orders
      } else {
        toast.error(`Failed to create test order: ${data.error}`)
      }
    } catch (error: any) {
      console.error('Error creating test order:', error)
      toast.error(`Error: ${error.message}`)
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Order Management</h1>
              <p className="text-gray-500 mt-2">View and manage customer orders</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadOrders}
                className="flex items-center"
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={createTestOrder}
                className="flex items-center"
              >
                Create Test Order
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/fix-rls')}
                className="flex items-center"
              >
                <Shield className="h-4 w-4 mr-1" />
                Fix RLS
              </Button>
            </div>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Error loading orders</p>
                <p className="text-sm">{error}</p>
                {error.includes('service role key') && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/admin/fix-rls')}
                      className="flex items-center text-red-700 border-red-300"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Go to Fix RLS Page
                    </Button>
                  </div>
                )}
              </div>
            )}
            
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
                {debugInfo && (
                  <div className="mt-8 w-full max-w-2xl">
                    <h4 className="text-sm font-medium mb-2">Debug Information:</h4>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                )}
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