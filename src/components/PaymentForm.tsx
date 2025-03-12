'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PayPalCheckoutButton from './PayPalButton';
import { useCart } from '@/lib/contexts/CartContext';
import { Separator } from '@/components/ui/separator';

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
  const { cart } = useCart();
  
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
          
          {/* Order Summary */}
          <div className="space-y-2 bg-gray-50 p-3 rounded-md">
            <Label>Resumen del Pedido</Label>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Cantidad de artículos:</span>
                <span className="font-medium">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
              </div>
              
              <Separator className="my-2" />
              
              {/* Item list */}
              <div className="max-h-32 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs py-1">
                    <span>{item.quantity} x {item.product.name}</span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente</Label>
            <Input 
              id="customer" 
              value={customerName || customerEmail}
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