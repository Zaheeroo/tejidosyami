'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag, Package, Clock, CheckCircle, XCircle, RefreshCcw, Shield, X, ExternalLink, Search, AlertTriangle } from 'lucide-react'
import { Order, updateOrderStatus } from '@/lib/services/order-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/supabase-client'
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

// Available order statuses
const ORDER_STATUSES = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

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
  
  // Status update state
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false)
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

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
        
        // Use the API endpoint to fetch orders
        const response = await fetch('/api/admin/get-all-orders');
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch orders');
        }
        
        console.log('Orders loaded from API:', data.orders.length);
        setOrders(data.orders);
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

  // Function to open status update dialog
  const openStatusUpdate = (order: Order) => {
    setOrderToUpdate(order)
    setNewStatus(order.status)
    setIsStatusUpdateOpen(true)
  }

  // Function to handle status update
  const handleUpdateStatus = async () => {
    if (!orderToUpdate || !newStatus) return;
    
    try {
      setIsUpdatingStatus(true)
      
      // Call API to update order status
      const response = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderToUpdate.id,
          status: newStatus
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderToUpdate.id ? { ...order, status: newStatus } : order
      ))
      
      toast.success(`Order status updated to ${newStatus}`)
      setIsStatusUpdateOpen(false)
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(`Failed to update order status: ${error.message}`)
    } finally {
      setIsUpdatingStatus(false)
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
                          <div className="flex items-center space-x-2">
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => openStatusUpdate(order)}
                              title="Update Status"
                            >
                              <RefreshCcw className="h-3 w-3" />
                            </Button>
                          </div>
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

        {/* Order Details Dialog */}
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
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant={getStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>{' '}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 align-middle" 
                          onClick={() => {
                            setIsDetailsOpen(false)
                            setTimeout(() => openStatusUpdate(selectedOrder), 100)
                          }}
                          title="Update Status"
                        >
                          <RefreshCcw className="h-3 w-3" />
                        </Button>
                      </p>
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

        {/* Status Update Alert Dialog */}
        <AlertDialog open={isStatusUpdateOpen} onOpenChange={setIsStatusUpdateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Order Status</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to change the status of order <span className="font-mono font-medium">{orderToUpdate?.id}</span>.
                This action will be recorded and may trigger notifications to the customer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <Badge 
                    variant={getStatusVariant(orderToUpdate?.status || '')}
                    className={`${
                      (orderToUpdate?.status || '').toLowerCase() === 'pending' ? 'bg-yellow-500' :
                      (orderToUpdate?.status || '').toLowerCase() === 'completed' ? 'bg-green-500' :
                      (orderToUpdate?.status || '').toLowerCase() === 'processing' ? 'bg-blue-500' :
                      (orderToUpdate?.status || '').toLowerCase() === 'shipped' ? 'bg-purple-500' :
                      (orderToUpdate?.status || '').toLowerCase() === 'cancelled' ? 'bg-red-500' :
                      'bg-yellow-500'
                    } text-white border-none`}
                  >
                    {orderToUpdate?.status}
                  </Badge>
                </div>
                <div className="flex items-center">
                  <span className="mx-2">→</span>
                </div>
                <div className="flex-grow">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {newStatus.toLowerCase() === 'cancelled' && (
                <div className="flex p-4 mb-4 text-amber-800 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Warning:</span> Cancelling an order cannot be undone and may affect inventory and customer satisfaction.
                  </div>
                </div>
              )}
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus || newStatus === orderToUpdate?.status}
                className={`${
                  newStatus.toLowerCase() === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </>
  )
} 