'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PaymentForm from '@/components/PaymentForm';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase/supabase-client';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import AuthDebug from '@/components/AuthDebug';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { user, loading } = useAuth();
  const [orderId, setOrderId] = useState<string>('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Only proceed if authentication loading is complete
    if (loading) return;
    
    console.log('Auth state:', { user, loading });
    
    // Check if we have an existing order ID in the URL
    const existingOrderId = searchParams.get('orderId');
    
    if (existingOrderId) {
      setOrderId(existingOrderId);
      setIsCreatingOrder(false);
      return;
    }
    
    // Generate a temporary order ID without creating an order in the database yet
    const generateTemporaryOrderId = () => {
      try {
        if (!user) {
          setError('You must be logged in to checkout');
          setIsCreatingOrder(false);
          return;
        }
        
        if (cart.length === 0) {
          setError('Your cart is empty');
          setIsCreatingOrder(false);
          return;
        }
        
        console.log('Generating temporary order ID for user:', user.id);
        console.log('Cart items:', cart);
        
        // Generate a new order ID but don't save to database yet
        const tempOrderId = uuidv4();
        console.log('Generated temporary order ID:', tempOrderId);
        
        // Store cart items in localStorage for later use
        localStorage.setItem(`cart_${tempOrderId}`, JSON.stringify({
          items: cart,
          total: cartTotal,
          userId: user.id,
          createdAt: new Date().toISOString()
        }));
        
        // Set the order ID for the payment form
        setOrderId(tempOrderId);
        setIsCreatingOrder(false);
        
      } catch (err: any) {
        console.error('Error generating temporary order ID:', err);
        setError(err.message || 'Failed to prepare checkout');
        setIsCreatingOrder(false);
      }
    };
    
    // Only generate a temporary order ID if we don't have an existing one
    if (!existingOrderId) {
      generateTemporaryOrderId();
    }
  }, [cart, cartTotal, searchParams, user, loading]);
  
  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg">Checking authentication...</p>
          </div>
        </main>
        <AuthDebug />
      </>
    );
  }
  
  if (isCreatingOrder) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg">Creating your order...</p>
          </div>
        </main>
        <AuthDebug />
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-lg">{error}</p>
            
            {error === 'You must be logged in to checkout' && (
              <div className="mt-6">
                <Button 
                  onClick={() => router.push('/login?redirect=/checkout')}
                  className="mx-auto"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        </main>
        <AuthDebug />
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Checkout</h1>
        
        {user && orderId && (
          <PaymentForm
            orderId={orderId}
            amount={cartTotal}
            customerEmail={user.email || ''}
            customerName={user.user_metadata?.full_name || ''}
            description={`Payment for order ${orderId}`}
          />
        )}
        
        {!user && (
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">You must be logged in to checkout</p>
            <Button 
              onClick={() => router.push('/login?redirect=/checkout')}
              className="mx-auto"
            >
              Go to Login
            </Button>
          </div>
        )}
      </main>
      <AuthDebug />
    </>
  );
} 