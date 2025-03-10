'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag, Package, Clock, CheckCircle, XCircle, RefreshCcw, Shield, X, ExternalLink, Search } from 'lucide-react'
import { getOrders, Order, updateOrderStatus } from '@/lib/services/order-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from '@/lib/supabase/supabase-client'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Helper function to get status variant for the badge
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'default' // Green
    case 'processing':
      return 'secondary' // Blue
    case 'shipped':
      return 'default' // Purple
    case 'cancelled':
      return 'destructive' // Red
    case 'pending':
      return 'secondary' // Yellow
    default:
      return 'secondary' // Yellow for any other status
  }
}

// Function to format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Function to view order details
function viewOrderDetails(order: Order) {
  // You can implement this function to show a modal or navigate to a details page
  console.log('Viewing order details:', order)
  // For now, we'll just show the order details in a toast
  toast(`Order ${order.id} - ${order.items?.length || 0} items - Total: $${order.total_amount.toFixed(2)}`)
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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
        
        // Try the direct API endpoint first (since it works reliably)
        try {
          console.log('Using direct API endpoint as primary method...')
          const response = await fetch('/api/admin/get-all-orders')
          const data = await response.json()
          
          if (data.success && data.orders && data.orders.length > 0) {
            console.log('Orders from API endpoint:', data.orders)
            setOrders(data.orders)
            // No error message needed since this is now the primary method
            setError(null)
            return
          } else if (!data.success) {
            console.error('API endpoint error:', data.error)
            setError(`API endpoint error: ${data.error}`)
          }
        } catch (apiError: any) {
          console.error('Error fetching from API endpoint:', apiError)
          setError(`API error: ${apiError.message}`)
        }
        
        // If API endpoint failed, try to get orders using the order service
        try {
          console.log('API endpoint failed, trying order service...')
          const ordersData = await getOrders()
          console.log('Orders from service:', ordersData)
          
          if (ordersData && ordersData.length > 0) {
            setOrders(ordersData)
            // If we got orders successfully, clear any error
            setError(null)
            return
          } else {
            console.log('No orders returned from service, trying direct query...')
          }
        } catch (serviceError: any) {
          console.error('Error from order service:', serviceError)
          
          // If the error is about the service role key, show a helpful message
          if (serviceError.message && (
              serviceError.message.includes('supabaseKey') || 
              serviceError.message.includes('service_role')
            )) {
            setError((prevError) => 
              prevError 
                ? `${prevError}. Service role key is not available or RLS policies need to be updated.` 
                : 'Service role key is not available or RLS policies need to be updated. Please visit the Fix RLS page to update the RLS policies.'
            )
          } else {
            setError((prevError) => 
              prevError 
                ? `${prevError}. Service error: ${serviceError.message}` 
                : `Service error: ${serviceError.message}`
            )
          }
        }
        
        // If both API endpoint and service method failed, try to query the orders table directly
        try {
          console.log('Trying direct query as last resort...')
          const { data: directOrders, error: directError } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items(
                *,
                product:products(name, image_url)
              )
            `)
            .order('created_at', { ascending: false })
          
          console.log('Direct orders query:', directOrders)
          console.log('Direct query error:', directError)
          
          // If direct query worked, use the results
          if (directOrders && directOrders.length > 0) {
            setOrders(directOrders as Order[])
            // If we got orders directly, show a different message
            if (error) {
              setError('Using direct query results. For better performance, please fix RLS policies.')
            }
          } else if (directError) {
            // If all methods failed, show a combined error
            setError(`Direct query error: ${directError.message}. Please update RLS policies.`)
          }
        } catch (directQueryError: any) {
          console.error('Error querying orders directly:', directQueryError)
          setError((prevError) => 
            prevError 
              ? `${prevError}. Additional error: ${directQueryError.message}` 
              : `Error: ${directQueryError.message}`
          )
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

  // Filter orders based on search query and filters
  useEffect(() => {
    let result = [...orders]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.email?.toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase())
    }
    
    // Apply payment filter
    if (paymentFilter !== 'all') {
      result = result.filter(order => order.payment_status.toLowerCase() === paymentFilter.toLowerCase())
    }
    
    setFilteredOrders(result)
  }, [orders, searchQuery, statusFilter, paymentFilter])

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

  // Function to view order details
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
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
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search orders by ID, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {orders.length === 0 
                    ? "There are no customer orders in the system yet."
                    : "No orders match your search criteria."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.id}
                        </TableCell>
                        <TableCell>
                          {order.customer?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.customer?.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.created_at ? (
                            <time dateTime={order.created_at}>
                              {new Date(order.created_at).toLocaleDateString()}
                            </time>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusVariant(order.status)}
                            className={`${
                              order.status.toLowerCase() === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
                              order.status.toLowerCase() === 'completed' ? 'bg-green-500 hover:bg-green-600' :
                              order.status.toLowerCase() === 'processing' ? 'bg-blue-500 hover:bg-blue-600' :
                              order.status.toLowerCase() === 'shipped' ? 'bg-purple-500 hover:bg-purple-600' :
                              order.status.toLowerCase() === 'cancelled' ? 'bg-red-500 hover:bg-red-600' :
                              'bg-yellow-500 hover:bg-yellow-600'
                            } text-white border-none`}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(order.payment_status)}
                        </TableCell>
                        <TableCell>
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                        </TableCell>
                        <TableCell>
                          ${order.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                            className="flex items-center"
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

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Order Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Order ID:</span> {selectedOrder.id}</p>
                      <p><span className="font-medium">Date:</span> {formatDate(selectedOrder.created_at || '')}</p>
                      <p><span className="font-medium">Status:</span> <Badge variant={getStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
                      <p><span className="font-medium">Total Amount:</span> ${selectedOrder.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customer?.name || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <DialogFooter>
                  <div className="flex justify-between items-center w-full">
                    <div className="text-sm text-gray-500">
                      Last updated: {formatDate(selectedOrder.updated_at || selectedOrder.created_at || '')}
                    </div>
                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                      Close
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
} 