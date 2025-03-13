'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/SupabaseAuthContext';

interface TilopayButtonProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName?: string;
  description?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

export default function TilopayButton({
  orderId,
  amount,
  customerEmail,
  customerName = '',
  description = '',
  onSuccess,
  onError
}: TilopayButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  
  const handleTilopayPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      console.log('Creating Tilopay payment for order ID:', orderId);
      console.log('Current user ID:', user?.id);
      
      // Store cart data in localStorage before redirecting
      const cartData = {
        items: cart,
        total: cartTotal,
        userId: user?.id || null,
        customerEmail: customerEmail,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`cart_${orderId}`, JSON.stringify(cartData));
      
      console.log('Stored cart data with user ID:', user?.id || 'null (guest checkout)');
      
      // Create a Tilopay payment URL
      const response = await fetch('/api/payments/tilopay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency: 'USD',
          orderId,
          customerEmail,
          customerName,
          description: description || `Pago para el pedido ${orderId}`,
          returnUrl: `${window.location.origin}/checkout/success?orderId=${orderId}&paymentMethod=tilopay`,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      if (!data.success || !data.paymentUrl) {
        throw new Error(data.error || 'Error al crear el pago con Tilopay');
      }
      
      console.log('Tilopay payment URL created successfully:', data.paymentUrl);
      
      // Redirect to Tilopay payment page
      window.location.href = data.paymentUrl;
      
    } catch (error: any) {
      console.error('Error creating Tilopay payment:', error);
      toast.error(error.message || 'Error al crear el pago con Tilopay');
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Button
      onClick={handleTilopayPayment}
      disabled={isProcessing}
      className="w-full bg-[#0066cc] hover:bg-[#004d99] text-white"
    >
      <CreditCard className="mr-2 h-4 w-4" />
      {isProcessing ? 'Procesando...' : 'Pagar con Tarjeta (Tilopay)'}
    </Button>
  );
} 