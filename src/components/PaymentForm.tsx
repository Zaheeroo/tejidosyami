'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PaymentFormProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName?: string;
  description?: string;
}

export default function PaymentForm({
  orderId,
  amount,
  customerEmail,
  customerName = '',
  description = ''
}: PaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      // Create the payment request
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'USD', // Change as needed
          orderId,
          customerEmail,
          customerName,
          description: description || `Payment for order ${orderId}`,
          redirectUrl: `${window.location.origin}/checkout/success?orderId=${orderId}`,
          callbackUrl: `${window.location.origin}/api/payments/webhook`
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.paymentUrl) {
        // Redirect to Onvopay payment page
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.error || 'Failed to initiate payment');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          You will be redirected to Onvopay to complete your payment securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-id">Order ID</Label>
            <Input id="order-id" value={orderId} disabled />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              value={`$${amount.toFixed(2)}`} 
              disabled 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={customerEmail} 
              disabled 
            />
          </div>
          
          {description && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={description} 
                disabled 
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Button>
      </CardFooter>
    </Card>
  );
} 