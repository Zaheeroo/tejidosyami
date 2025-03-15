'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, ShoppingBag, ExternalLink, Package, Calendar, CreditCard } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase/supabase-client'

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

// Function to format payment method for display
const formatPaymentMethod = (method?: string) => {
  if (!method) return 'Not specified';
  
  switch (method.toLowerCase()) {
    case 'paypal':
      return 'PayPal';
    case 'credit_card':
      return 'Credit Card';
    case 'test_card':
      return 'Test Payment';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

// Function to format payment provider for display
const formatPaymentProvider = (provider?: string) => {
  if (!provider) return 'Not specified';
  
  switch (provider.toLowerCase()) {
    case 'paypal':
      return 'PayPal';
    case 'tilopay':
      return 'Tilopay';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
};

export default function CustomerOrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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
          
          // Fetch payment details for each order
          const ordersWithPayments = await Promise.all(
            ordersData.map(async (order) => {
              try {
                // Get payment details for this order
                const { data: payments, error } = await supabase
                  .from('payments')
                  .select('*')
                  .eq('order_id', order.id)
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (error) {
                  console.error(`Error fetching payment for order ${order.id}:`, error);
                  return order;
                }
                
                // Add payment details to the order
                if (payments && payments.length > 0) {
                  return {
                    ...order,
                    payment: payments[0]
                  };
                }
                
                return order;
              } catch (error) {
                console.error(`Error processing payment for order ${order.id}:`, error);
                return order;
              }
            })
          );
          
          setOrders(ordersWithPayments)
          
          // Log to verify
          console.log('Orders page - Order count:', ordersWithPayments.length, 'distinct orders')
          console.log('Orders page - Total items across all orders:', ordersWithPayments.reduce((total, order) => 
            total + (order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0))
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
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">Processing</Badge>
      case 'shipped':
        return <Badge className="bg-violet-500 hover:bg-violet-600 text-white border-none">Shipped</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none">Cancelled</Badge>
      case 'pending':
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">Pending</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Paid</Badge>
      case 'refunded':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">Refunded</Badge>
      case 'failed':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none">Failed</Badge>
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">Pending</Badge>
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
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link href="/customer/dashboard" className="flex items-center text-rose-600 hover:text-rose-700 mb-2 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
                <p className="text-gray-600">Track and manage your crochet purchases</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link href="/products">
                  <Button className="bg-rose-500 hover:bg-rose-600">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">Total Orders</CardTitle>
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">{orders.length}</div>
                <p className="text-sm text-gray-500">
                  Orders placed
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">Recent Order</CardTitle>
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-teal-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-800 mb-1 truncate">
                  {orders.length > 0 && orders[0].created_at 
                    ? formatDate(orders[0].created_at).split(',')[0]
                    : 'No orders yet'}
                </div>
                <p className="text-sm text-gray-500">
                  Last purchase date
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">Items Purchased</CardTitle>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {orders.reduce((total, order) => 
                    total + (order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0)}
                </div>
                <p className="text-sm text-gray-500">
                  Total items bought
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Orders Table */}
          <Card className="border-0 shadow-md bg-white mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Order History</CardTitle>
              <CardDescription>View details of all your past orders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-rose-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-rose-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
                    <ShoppingBag className="h-10 w-10 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-gray-800">No Orders Yet</h3>
                  <p className="text-gray-600 text-center max-w-md mb-8">
                    You haven't placed any orders yet. Explore our handcrafted crochet items and make your first purchase.
                  </p>
                  <Link href="/products">
                    <Button className="bg-rose-500 hover:bg-rose-600">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-medium">Order ID</TableHead>
                        <TableHead className="font-medium">Date</TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                        <TableHead className="font-medium">Payment</TableHead>
                        <TableHead className="font-medium">Products</TableHead>
                        <TableHead className="font-medium">Total</TableHead>
                        <TableHead className="font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium text-gray-700">
                            {order.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {order.created_at ? formatDate(order.created_at) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell>
                            {order.payment ? (
                              <div className="flex flex-col">
                                <span className="text-sm">{formatPaymentMethod(order.payment.payment_method)}</span>
                                {getPaymentStatusBadge(order.payment.status)}
                              </div>
                            ) : (
                              <span className="text-gray-500">Not available</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                          </TableCell>
                          <TableCell className="font-medium text-gray-800">
                            ${order.total_amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-rose-200 text-gray-700 hover:bg-rose-100"
                              onClick={() => viewOrderDetails(order)}
                            >
                              View Details
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
                <DialogTitle className="text-xl font-bold text-gray-800">Order Details</DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500">Order ID:</div>
                          <div className="text-gray-800 font-medium">{selectedOrder.id}</div>
                          
                          <div className="text-gray-500">Date:</div>
                          <div className="text-gray-800">{selectedOrder.created_at ? formatDate(selectedOrder.created_at) : 'N/A'}</div>
                          
                          <div className="text-gray-500">Status:</div>
                          <div>{getStatusBadge(selectedOrder.status)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Payment Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedOrder.payment ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Method:</div>
                            <div className="text-gray-800">{formatPaymentMethod(selectedOrder.payment.payment_method)}</div>
                            
                            <div className="text-gray-500">Provider:</div>
                            <div className="text-gray-800">{formatPaymentProvider(selectedOrder.payment.provider)}</div>
                            
                            <div className="text-gray-500">Status:</div>
                            <div>{getPaymentStatusBadge(selectedOrder.payment.status)}</div>
                          </div>
                        ) : (
                          <p className="text-gray-500">Payment information not available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Order Items</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <div className="space-y-4">
                          {selectedOrder.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                              <div>
                                <p className="font-medium text-gray-800">{item.product?.name || 'Unknown Product'}</p>
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              </div>
                              <p className="font-medium text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                          
                          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                            <p className="font-medium text-gray-800">Total</p>
                            <p className="font-bold text-gray-800">${selectedOrder.total_amount?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No items in this order</p>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDetailsOpen(false)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
} 