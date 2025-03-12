'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import AuthDebug from '@/components/AuthDebug';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PaymentStatus {
  success: boolean;
  status: 'completed' | 'failed' | 'pending';
  message?: string;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  provider?: 'onvopay' | 'paypal';
}

// This component calls a server-side API to process the payment
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the order ID from the URL
  const orderId = searchParams.get('orderId');
  const mockPayment = searchParams.get('mockPayment');
  const paymentId = searchParams.get('paymentId');
  const testCard = searchParams.get('testCard');
  
  // Process payment and clear cart on initial render
  useEffect(() => {
    // Clear the cart
    clearCart();
    
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
    
    if (orderId && mockPayment === 'true' && paymentId) {
      processPayment();
    } else if (orderId && paymentId) {
      // This is a real payment that was redirected back from Onvopay or PayPal
      // Determine if this is a PayPal payment
      const isPayPal = paymentId.startsWith('PAY-') || paymentId.length > 20;
      
      setPaymentStatus({
        success: true,
        status: 'completed',
        orderId: orderId,
        paymentId: paymentId,
        provider: isPayPal ? 'paypal' : 'onvopay'
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
              <p className="text-lg">Processing your payment...</p>
            </div>
          ) : paymentStatus?.status === 'completed' ? (
            <>
              <div className="mb-6 flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
              
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your payment has been processed successfully.
                {orderId && (
                  <span className="block mt-2">
                    Order ID: <span className="font-medium">{orderId}</span>
                  </span>
                )}
                {paymentStatus.transactionId && (
                  <span className="block mt-1">
                    Transaction ID: <span className="font-medium">{paymentStatus.transactionId}</span>
                  </span>
                )}
                {paymentStatus.provider && (
                  <span className="block mt-1">
                    Payment Method: <span className="font-medium capitalize">{paymentStatus.provider}</span>
                  </span>
                )}
              </p>
              
              <p className="text-gray-600 mb-8">
                A confirmation email has been sent to your email address.
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push('/customer/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push('/products')}>
                  Continue Shopping
                </Button>
              </div>
            </>
          ) : paymentStatus?.status === 'pending' ? (
            <>
              <div className="mb-6 flex justify-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Payment Pending</h1>
              
              <p className="text-gray-600 mb-6">
                Your payment is being processed. This may take a few moments.
                {orderId && (
                  <span className="block mt-2">
                    Order ID: <span className="font-medium">{orderId}</span>
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
                <AlertTitle>Payment in Progress</AlertTitle>
                <AlertDescription>
                  Please do not close this page. We'll update you once the payment is complete.
                </AlertDescription>
              </Alert>
              
              <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
              
              <p className="text-gray-600 mb-6">
                We couldn't process your payment. Please try again.
                {paymentStatus?.message && (
                  <span className="block mt-2 text-red-600">
                    {paymentStatus.message}
                  </span>
                )}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push('/checkout')}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
                  Go to Dashboard
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