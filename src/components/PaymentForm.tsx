'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PayPalCheckoutButton from './PayPalButton';

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
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete su pago</CardTitle>
        <CardDescription>
          Utilice PayPal para completar su pedido de forma segura.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-id">ID de Pedido</Label>
            <Input id="order-id" value={orderId} disabled />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input 
              id="amount" 
              value={`$${amount.toFixed(2)}`} 
              disabled 
            />
          </div>
          
          <div className="mt-6">
            <PayPalCheckoutButton
              orderId={orderId}
              amount={amount}
              customerEmail={customerEmail}
              customerName={customerName}
              description={description || `Pago para el pedido ${orderId}`}
              onError={(error) => {
                console.error('PayPal payment error:', error);
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 