'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, AlertTriangle, Package, ArrowLeft, Heart } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderById, Order, OrderItem as OrderItemType } from '@/lib/services/order-service';

interface PaymentStatus {
  success: boolean;
  status: 'completed' | 'failed' | 'pending';
  message?: string;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  provider?: 'paypal' | 'tilopay';
}

interface OrderItem extends OrderItemType {
  name: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  id: string;
  total_amount: number;
  items: OrderItem[];
  payment_status: string;
  created_at: string;
}

// This component calls a server-side API to process the payment
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  // Get all parameters from the URL
  const orderId = searchParams.get('orderId');
  const mockPayment = searchParams.get('mockPayment');
  const paymentId = searchParams.get('paymentId');
  const testCard = searchParams.get('testCard');
  const paymentMethod = searchParams.get('paymentMethod');
  
  // Tilopay specific parameters
  const tilopayCode = searchParams.get('code');
  const tilopayDescription = searchParams.get('description');
  const tilopayAuth = searchParams.get('auth');
  const tilopayTransactionId = searchParams.get('tilopay-transaction');
  const tilopayOrderHash = searchParams.get('OrderHash');
  
  // Process payment and clear cart on initial render
  useEffect(() => {
    // Clear the cart
    clearCart();
    
    console.log('Success page: Order ID from URL:', orderId);
    console.log('Success page: Payment Method from URL:', paymentMethod);
    console.log('Success page: Tilopay Code:', tilopayCode);
    console.log('Success page: Tilopay Auth:', tilopayAuth);
    console.log('Success page: Tilopay Transaction:', tilopayTransactionId);
    
    // Fetch order details if we have an order ID
    const fetchOrderDetails = async () => {
      if (orderId) {
        try {
          console.log('Success page: Fetching order details for order ID:', orderId);
          const orderData = await getOrderById(orderId);
          console.log('Success page: Order details fetched:', orderData);
          
          if (orderData && orderData.items) {
            setOrderDetails({
              id: orderData.id,
              total_amount: orderData.total_amount,
              items: orderData.items.map((item: any) => ({
                ...item,
                name: item.name || item.product_name,
                price: item.price || item.unit_price
              })),
              payment_status: orderData.payment_status || 'pending',
              created_at: orderData.created_at || new Date().toISOString()
            });

            // If we have order details and payment was successful, ensure payment status is set
            if (orderData.payment_status === 'paid' && paymentId) {
              setPaymentStatus({
                success: true,
                status: 'completed',
                orderId: orderId,
                paymentId: paymentId,
                provider: paymentMethod as 'paypal' | 'tilopay' || 'paypal'
              });
            }
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      }
    };
    
    // Process the payment only once on page load
    const processPayment = async () => {
      try {
        setIsLoading(true);
        
        // Check if we've already processed this payment
        const storageKey = `payment_processed_${orderId}`;
        if (localStorage.getItem(storageKey)) {
          console.log('Payment already processed according to localStorage');
          
          // If it's a test payment, check the status
          if (testCard && paymentId) {
            await checkPaymentStatus(paymentId, testCard);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Call the server-side API to process the payment
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            paymentId,
            mockPayment,
            testCard,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Payment processed successfully');
          // Mark this payment as processed in localStorage
          localStorage.setItem(storageKey, 'true');
          
          // If it's a test payment, check the status
          if (testCard && paymentId) {
            await checkPaymentStatus(paymentId, testCard);
          } else {
            setPaymentStatus({
              success: true,
              status: 'completed',
              orderId: orderId || undefined,
              paymentId: paymentId || undefined,
              provider: 'paypal'
            });
          }
        } else {
          console.error('Error processing payment:', data.error);
          setPaymentStatus({
            success: false,
            status: 'failed',
            message: data.error || 'Payment processing failed',
            orderId: orderId || undefined,
            paymentId: paymentId || undefined,
          });
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error calling payment process API:', error);
        setPaymentStatus({
          success: false,
          status: 'failed',
          message: error.message || 'An unexpected error occurred',
          orderId: orderId || undefined,
          paymentId: paymentId || undefined,
        });
        setIsLoading(false);
      }
    };
    
    const checkPaymentStatus = async (paymentId: string, testCard: string) => {
      try {
        const response = await fetch(`/api/payments/status/${paymentId}?testCard=${testCard}`);
        const data = await response.json();
        
        if (data.success) {
          setPaymentStatus({
            success: true,
            status: data.status,
            message: data.message,
            paymentId: data.paymentId,
            orderId: data.orderId || orderId,
            transactionId: data.transactionId,
            provider: 'paypal'
          });
        } else {
          setPaymentStatus({
            success: false,
            status: 'failed',
            message: data.error || 'Failed to check payment status',
            orderId: orderId || undefined,
            paymentId: paymentId || undefined,
          });
        }
      } catch (error: any) {
        console.error('Error checking payment status:', error);
        setPaymentStatus({
          success: false,
          status: 'failed',
          message: error.message || 'Failed to check payment status',
          orderId: orderId || undefined,
          paymentId: paymentId || undefined,
        });
      }
    };
    
    // Add a short delay before fetching order details to ensure the order has been created
    const delayedFetch = () => {
      // For Tilopay payments, add a slightly longer delay since we need to create the order first
      const delayTime = paymentMethod === 'tilopay' ? 1000 : 300;
      
      setTimeout(() => {
        fetchOrderDetails();
      }, delayTime);
    };
    
    // Instead of calling fetchOrderDetails directly, use the delayed version
    delayedFetch();
    
    if (orderId && mockPayment === 'true' && paymentId) {
      processPayment();
    } else if (orderId && paymentId) {
      // This is a PayPal payment callback - payment was already captured successfully
      // Set payment status as successful immediately
      setPaymentStatus({
        success: true,
        status: 'completed',
        orderId: orderId,
        paymentId: paymentId,
        provider: 'paypal'
      });

      // Clear cart data since payment was successful
      localStorage.removeItem(`cart_${orderId}`);
      
      // Try to update order status in database, but don't affect the UI if it fails
      (async () => {
        try {
          const response = await fetch('/api/payments/paypal/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              paymentId,
              status: 'paid'
            }),
          });
          
          const data = await response.json();
          
          if (!data.success) {
            // Just log the error but don't change the UI state
            console.error('Error updating order status:', data.error);
          }
        } catch (error) {
          // Just log the error but don't change the UI state
          console.error('Error updating order status:', error);
        }
      })();
      
      setIsLoading(false);
    } else if (orderId && tilopayCode && tilopayTransactionId) {
      // This is a Tilopay payment callback
      (async () => {
        try {
          // Get cart data from localStorage using the same format as PayPal
          const cartDataString = localStorage.getItem(`cart_${orderId}`);
          const cartData = cartDataString ? JSON.parse(cartDataString) : null;

          if (!cartData) {
            console.error('Cart data not found in localStorage');
            setPaymentStatus({
              success: false,
              status: 'failed',
              message: 'Error: Cart data not found',
              orderId: orderId
            });
            setIsLoading(false);
            return;
          }

          // Update order status in database with Tilopay response
          const response = await fetch('/api/payments/tilopay/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              cartData,
              tilopayResponse: {
                code: tilopayCode,
                description: tilopayDescription,
                auth: tilopayAuth,
                transactionId: tilopayTransactionId,
                orderHash: tilopayOrderHash
              }
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            console.log('Order status updated successfully');
            setPaymentStatus({
              success: true,
              status: 'completed',
              orderId: orderId,
              transactionId: tilopayTransactionId || data.transactionId || undefined,
              provider: 'tilopay',
              message: tilopayDescription || undefined
            });

            // Set order details from the response
            if (data.orderDetails) {
              try {
                setOrderDetails({
                  id: data.orderDetails.id,
                  total_amount: data.orderDetails.total_amount || 0,
                  items: Array.isArray(data.orderDetails.items) 
                    ? data.orderDetails.items.map((item: any) => ({
                        ...item,
                        name: item.name || item.product_name || item.product?.name || 'Unknown Product',
                        price: item.price || item.unit_price || 0,
                        quantity: item.quantity || 1
                      }))
                    : [], // If items is not an array, use an empty array
                  payment_status: data.orderDetails.payment_status || 'pending',
                  created_at: data.orderDetails.created_at || new Date().toISOString()
                });
              } catch (error) {
                console.error('Error parsing order details:', error);
                // Create a minimal order details object
                setOrderDetails({
                  id: data.orderDetails.id || orderId,
                  total_amount: data.orderDetails.total_amount || cartData.total || 0,
                  items: [],
                  payment_status: data.orderDetails.payment_status || 'pending',
                  created_at: data.orderDetails.created_at || new Date().toISOString()
                });
              }
            } else {
              // Create a minimal order details object from cart data
              setOrderDetails({
                id: orderId,
                total_amount: cartData.total || 0,
                items: cartData.items.map((item: any) => ({
                  id: item.product.id,
                  name: item.product.name || 'Unknown Product',
                  price: item.product.price || 0,
                  quantity: item.quantity || 1,
                  subtotal: (item.product.price || 0) * (item.quantity || 1)
                })),
                payment_status: 'paid',
                created_at: new Date().toISOString()
              });
            }

            // Clear cart data from localStorage
            localStorage.removeItem(`cart_${orderId}`);
          } else {
            console.error('Error updating order status:', data.error);
            setPaymentStatus({
              success: false,
              status: 'failed',
              message: tilopayDescription || data.error || 'Error al actualizar el estado del pago',
              orderId: orderId,
              transactionId: tilopayTransactionId
            });
          }
        } catch (error: any) {
          console.error('Error updating order status:', error);
          setPaymentStatus({
            success: false,
            status: 'failed',
            message: error.message || 'Error al actualizar el estado del pago',
            orderId: orderId,
            transactionId: tilopayTransactionId
          });
        }
        
        setIsLoading(false);
      })();
    } else {
      setIsLoading(false);
    }
  }, []);
  
  // Render based on payment status
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {isLoading ? (
              <Card className="border-rose-100 shadow-md">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center">
                      <div className="h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-lg font-medium text-gray-700">Procesando su pago...</p>
                  </div>
                </CardContent>
              </Card>
            ) : paymentStatus?.status === 'completed' ? (
              <>
                <div className="mb-6">
                  <Link href="/">
                    <Button 
                      variant="ghost" 
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a la Tienda
                    </Button>
                  </Link>
                </div>
                
                <Card className="border-rose-100 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-100 to-amber-100 p-8 flex flex-col items-center">
                    <div className="mb-4 h-20 w-20 rounded-full bg-white shadow-md flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-rose-800 text-center">¡Pago Exitoso!</h1>
                    <p className="text-amber-700 mt-2 text-center">Gracias por su compra de productos artesanales</p>
                  </div>
                  
                  <CardContent className="p-6">
                    <Alert className="mb-6 border-green-100 bg-green-50">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Pedido Confirmado</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Su pedido ha sido procesado exitosamente.
                        {paymentStatus.orderId && (
                          <div className="mt-2">
                            <strong>Número de Pedido:</strong> {paymentStatus.orderId}
                          </div>
                        )}
                        {paymentStatus.transactionId && (
                          <div className="mt-1">
                            <strong>ID de Transacción:</strong> {paymentStatus.transactionId}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                    
                    {orderDetails && (
                      <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-100">
                        <h2 className="font-serif font-semibold text-amber-800 mb-3">Detalles del Pedido</h2>
                        
                        <div className="space-y-2">
                          {orderDetails.items && orderDetails.items.length > 0 ? (
                            orderDetails.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center mr-2 text-xs font-medium text-rose-700">
                                    {item.quantity}
                                  </div>
                                  <span className="text-gray-700">{item.name}</span>
                                </div>
                                <span className="font-medium text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">No hay detalles de productos disponibles</div>
                          )}
                          
                          <Separator className="my-3 bg-amber-200" />
                          
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-800">Total:</span>
                            <span className="text-rose-700">${orderDetails.total_amount.toFixed(2)}</span>
                          </div>

                          <div className="text-sm text-gray-600 mt-3 bg-white p-2 rounded border border-amber-100">
                            <div className="flex items-center">
                              <span className="w-24">Fecha:</span>
                              <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24">Estado:</span>
                              <span className={orderDetails.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}>
                                {orderDetails.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <Link href="/customer/orders">
                        <Button
                          className="w-full bg-rose-600 hover:bg-rose-700"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Ver Mis Pedidos
                        </Button>
                      </Link>
                      
                      <Link href="/products">
                        <Button
                          variant="outline"
                          className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Explorar Más Productos
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <Link href="/">
                    <Button 
                      variant="ghost" 
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a la Tienda
                    </Button>
                  </Link>
                </div>
                
                <Card className="border-rose-100 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-100 to-amber-100 p-8 flex flex-col items-center">
                    <div className="mb-4 h-20 w-20 rounded-full bg-white shadow-md flex items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-rose-800 text-center">Error en el Pago</h1>
                  </div>
                  
                  <CardContent className="p-6">
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {paymentStatus?.message || 'Hubo un error al procesar su pago. Por favor, inténtelo de nuevo.'}
                        {paymentStatus?.orderId && (
                          <div className="mt-2">
                            <strong>Número de Pedido:</strong> {paymentStatus.orderId}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <Link href="/checkout">
                        <Button
                          className="w-full bg-rose-600 hover:bg-rose-700"
                        >
                          Intentar de Nuevo
                        </Button>
                      </Link>
                      
                      <Link href="/products">
                        <Button
                          variant="outline"
                          className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          Volver a Productos
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 