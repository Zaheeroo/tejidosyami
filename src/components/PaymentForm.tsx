'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PayPalCheckoutButton from './PayPalButton';
import TilopayButton from './TilopayButton';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/SupabaseAuthContext';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PaymentFormProps {
  orderId: string;
  amount?: number;
  customerEmail?: string;
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
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const [email, setEmail] = useState<string>(customerEmail || '');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the provided amount or fall back to cartTotal from context
  const totalAmount = amount !== undefined ? amount : cartTotal;
  
  // Get user email from auth context if not provided as prop
  useEffect(() => {
    if (!email && user?.email) {
      setEmail(user.email);
    }
    
    // Check if we have all required data
    if (orderId && totalAmount > 0) {
      if (!email) {
        setError('Se requiere un correo electrónico para procesar el pago');
      } else {
        setError(null);
        setIsReady(true);
      }
    } else {
      setIsReady(false);
      if (!orderId) {
        setError('ID de pedido no válido');
      } else if (!(totalAmount > 0)) {
        setError('El monto total debe ser mayor que cero');
      }
    }
  }, [orderId, totalAmount, email, user]);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete su pago</CardTitle>
        <CardDescription>
          Elija su método de pago preferido para completar su pedido de forma segura.
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
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente</Label>
            <Input 
              id="customer" 
              value={customerName || email || 'Cliente'}
              disabled 
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isReady ? (
            <div className="mt-6 space-y-4">
              <div>
                <Label className="mb-2 block">Métodos de Pago</Label>
                
                <TilopayButton
                  orderId={orderId}
                  amount={totalAmount}
                  customerEmail={email}
                  customerName={customerName}
                  description={description || `Pago para el pedido ${orderId}`}
                  onError={(error) => {
                    console.error('Tilopay payment error:', error);
                    setError(`Error de Tilopay: ${error.message || 'Error desconocido'}`);
                  }}
                />
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">O</span>
                  </div>
                </div>
                
                <PayPalCheckoutButton
                  orderId={orderId}
                  amount={totalAmount}
                  customerEmail={email}
                  customerName={customerName}
                  description={description || `Pago para el pedido ${orderId}`}
                  onError={(error) => {
                    console.error('PayPal payment error:', error);
                    setError(`Error de PayPal: ${error.message || 'Error desconocido'}`);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-amber-50 text-amber-800 rounded-md text-center">
              {!error ? 'Cargando opciones de pago...' : 'No se pueden mostrar las opciones de pago debido a un error.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 