'use client';

import React, { useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PayPalButtonProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName?: string;
  description?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

export default function PayPalCheckoutButton({
  orderId,
  amount,
  customerEmail,
  customerName = '',
  description = '',
  onSuccess,
  onError
}: PayPalButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const createOrder = async () => {
    try {
      // Create a PayPal order
      const response = await fetch('/api/payments/paypal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'USD',
          orderId,
          customerEmail,
          customerName,
          description: description || `Payment for order ${orderId}`,
          returnUrl: `${window.location.origin}/checkout/success?orderId=${orderId}`,
          cancelUrl: `${window.location.origin}/checkout?cancelled=true`,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }
      
      return data.orderId;
    } catch (error: any) {
      console.error('Error creating PayPal order:', error);
      toast.error(error.message || 'Failed to create PayPal order');
      if (onError) onError(error);
      throw error;
    }
  };
  
  const onApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    
    try {
      // Capture the funds from the transaction
      const response = await fetch('/api/payments/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          shopOrderId: orderId,
        }),
      });
      
      const captureData = await response.json();
      
      if (!captureData.success) {
        throw new Error(captureData.error || 'Failed to capture PayPal payment');
      }
      
      // Handle successful payment
      toast.success('Payment successful!');
      
      if (onSuccess) {
        onSuccess(captureData);
      }
      
      // Redirect to success page
      router.push(`/checkout/success?orderId=${orderId}&paymentId=${data.orderID}`);
      
    } catch (error: any) {
      console.error('Error capturing PayPal payment:', error);
      toast.error(error.message || 'Failed to process payment');
      if (onError) onError(error);
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="w-full">
      <PayPalButtons
        style={{ 
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay'
        }}
        disabled={isProcessing}
        forceReRender={[amount, orderId]}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {
          console.error('PayPal error:', err);
          toast.error('PayPal encountered an error');
          if (onError) onError(err);
        }}
        onCancel={() => {
          toast.info('Payment cancelled');
        }}
      />
    </div>
  );
} 