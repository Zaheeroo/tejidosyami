'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, AlertTriangle, Package } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import AuthDebug from '@/components/AuthDebug';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getOrderById, Order, OrderItem as OrderItemType } from '@/lib/services/order-service';

interface PaymentStatus {
  success: boolean;
  status: 'completed' | 'failed' | 'pending';
  message?: string;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  provider?: 'paypal';
}

interface OrderDetails {
  id: string;
  total_amount: number;
  items: OrderItemType[];
}

// This component calls a server-side API to process the payment
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  // Get the order ID from the URL
  const orderId = searchParams.get('orderId');
  const mockPayment = searchParams.get('mockPayment');
  const paymentId = searchParams.get('paymentId');
  const testCard = searchParams.get('testCard');
  
  // Process payment and clear cart on initial render
  useEffect(() => {
    // Clear the cart
    clearCart();
    
    console.log('Success page: Order ID from URL:', orderId);
    console.log('Success page: Payment ID from URL:', paymentId);
    
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
              items: orderData.items
            });
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
    
    fetchOrderDetails();
    
    if (orderId && mockPayment === 'true' && paymentId) {
      processPayment();
    } else if (orderId && paymentId) {
      // This is a payment that was redirected back from PayPal
      // We need to update the order status in the database
      (async () => {
        try {
          // Update order status in database
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
          
          if (data.success) {
            console.log('Order status updated successfully');
          } else {
            console.error('Error updating order status:', data.error);
          }
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      })();
      
      setPaymentStatus({
        success: true,
        status: 'completed',
        orderId: orderId,
        paymentId: paymentId,
        provider: 'paypal'
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  // Render based on payment status
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          {isLoading ? (
            <div className="text-center">
              <p className="text-lg">Procesando su pago...</p>
            </div>
          ) : paymentStatus?.status === 'completed' ? (
            <>
              <div className="mb-6 flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">¡Pago Exitoso!</h1>
              
              <p className="text-gray-600 mb-4">
                Gracias por su compra. Su pago ha sido procesado exitosamente.
              </p>
              
              {/* Order Details Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-gray-700" />
                  <h3 className="font-semibold">Detalles del Pedido</h3>
                </div>
                
                <div className="text-sm space-y-1">
                  {orderId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID de Pedido:</span>
                      <span className="font-medium">{orderId}</span>
                    </div>
                  )}
                  
                  {paymentStatus.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID de Transacción:</span>
                      <span className="font-medium">{paymentStatus.transactionId}</span>
                    </div>
                  )}
                  
                  {paymentStatus.provider && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método de Pago:</span>
                      <span className="font-medium">PayPal</span>
                    </div>
                  )}
                  
                  {orderDetails && (
                    <>
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Artículos:</span>
                        <span className="font-medium">
                          {orderDetails.items.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                      </div>
                      
                      <div className="max-h-24 overflow-y-auto my-1">
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs py-1">
                            <span>{item.quantity} x {item.product?.name || 'Producto'}</span>
                            <span>${item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${orderDetails.total_amount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Se ha enviado un correo de confirmación a su dirección de email.
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push('/customer/dashboard')}>
                  Ir al Panel
                </Button>
                <Button variant="outline" onClick={() => router.push('/products')}>
                  Continuar Comprando
                </Button>
              </div>
            </>
          ) : paymentStatus?.status === 'pending' ? (
            <>
              <div className="mb-6 flex justify-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Pago Pendiente</h1>
              
              <p className="text-gray-600 mb-6">
                Su pago está siendo procesado. Esto puede tomar unos momentos.
                {orderId && (
                  <span className="block mt-2">
                    ID de Pedido: <span className="font-medium">{orderId}</span>
                  </span>
                )}
                {paymentStatus.message && (
                  <span className="block mt-2 text-yellow-600">
                    {paymentStatus.message}
                  </span>
                )}
              </p>
              
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Pago en Proceso</AlertTitle>
                <AlertDescription>
                  Por favor no cierre esta página. Le informaremos cuando el pago esté completo.
                </AlertDescription>
              </Alert>
              
              <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
                Ir al Panel
              </Button>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Pago Fallido</h1>
              
              <p className="text-gray-600 mb-6">
                No pudimos procesar su pago. Por favor intente nuevamente.
                {paymentStatus?.message && (
                  <span className="block mt-2 text-red-600">
                    {paymentStatus.message}
                  </span>
                )}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push('/checkout')}>
                  Intentar Nuevamente
                </Button>
                <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
                  Ir al Panel
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <AuthDebug />
    </>
  );
} 