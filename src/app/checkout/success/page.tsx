'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import AuthDebug from '@/components/AuthDebug';

// This component calls a server-side API to process the payment
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  
  // Get the order ID from the URL
  const orderId = searchParams.get('orderId');
  const mockPayment = searchParams.get('mockPayment');
  const paymentId = searchParams.get('paymentId');
  
  // Process payment and clear cart on initial render
  useEffect(() => {
    // Clear the cart
    clearCart();
    
    // Process the payment only once on page load
    const processPayment = async () => {
      try {
        // Check if we've already processed this payment
        const storageKey = `payment_processed_${orderId}`;
        if (localStorage.getItem(storageKey)) {
          console.log('Payment already processed according to localStorage');
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
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Payment processed successfully');
          // Mark this payment as processed in localStorage
          localStorage.setItem(storageKey, 'true');
        } else {
          console.error('Error processing payment:', data.error);
        }
      } catch (error) {
        console.error('Error calling payment process API:', error);
      }
    };
    
    if (orderId && mockPayment === 'true' && paymentId) {
      processPayment();
    }
  }, []); // Empty dependency array means this runs once on mount
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
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
          </p>
          
          <p className="text-gray-600 mb-8">
            A confirmation email has been sent to your email address.
          </p>
          
          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={() => router.push('/customer/orders')}
            >
              View Your Orders
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
      <AuthDebug />
    </>
  );
} 