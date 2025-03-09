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
    
    // Create a new order in the database
    const createOrder = async () => {
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
        
        console.log('Creating order for user:', user.id);
        
        // Generate a new order ID
        const newOrderId = uuidv4();
        
        // Create order in the database
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: newOrderId,
            user_id: user.id,
            total_amount: cartTotal,
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date().toISOString()
          });
        
        if (orderError) {
          console.error('Order creation error:', orderError);
          throw new Error(orderError.message);
        }
        
        // Create order items
        const orderItems = cart.map(item => ({
          order_id: newOrderId,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          console.error('Order items creation error:', itemsError);
          throw new Error(itemsError.message);
        }
        
        console.log('Order created successfully:', newOrderId);
        
        // Set the order ID for the payment form
        setOrderId(newOrderId);
        setIsCreatingOrder(false);
        
      } catch (err: any) {
        console.error('Error creating order:', err);
        setError(err.message || 'Failed to create order');
        setIsCreatingOrder(false);
      }
    };
    
    createOrder();
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