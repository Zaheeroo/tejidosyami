'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PaymentForm from '@/components/PaymentForm';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/SupabaseAuthContext';
import { Loader2, ShoppingBag, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';

// This component handles the checkout process
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate a temporary order ID and store cart details in localStorage
  useEffect(() => {
    // Only proceed if user is authenticated and cart has items
    if (!authLoading && user && cart.length > 0 && !orderId) {
      setIsCreatingOrder(true);
      
      // Generate a UUID for the order ID to match database expectations
      const tempOrderId = uuidv4();
      setOrderId(tempOrderId);
      
      // Store cart details in localStorage
      const cartData = {
        items: cart.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image
          },
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity
        })),
        total: cartTotal,
        userId: user.id,
        customerEmail: user.email,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`cart_${tempOrderId}`, JSON.stringify(cartData));
      setIsCreatingOrder(false);
    }
  }, [authLoading, user, cart, cartTotal, orderId]);
  
  // If loading auth or creating order, show loading state
  if (authLoading || isCreatingOrder) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
              <p className="text-lg font-medium text-gray-700">Preparando su pedido...</p>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // If error, show error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-lg bg-white p-8 shadow-md">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push('/products')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Productos
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-rose-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-t-lg">
                <CardTitle className="text-center text-2xl font-serif text-rose-800">Finalizar Compra</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-rose-600" />
                  </div>
                  <h2 className="text-xl font-medium text-gray-800">Inicie sesión para continuar</h2>
                  <p className="text-gray-600">Para finalizar su compra, necesita iniciar sesión en su cuenta.</p>
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                    <Button onClick={() => router.push('/login?redirect=/checkout')} className="bg-rose-600 hover:bg-rose-700">
                      Iniciar Sesión
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/products')} className="border-rose-200 text-rose-700 hover:bg-rose-50">
                      Volver a Productos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }
  
  // If cart is empty, show empty cart message
  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="border-rose-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-t-lg">
                <CardTitle className="text-center text-2xl font-serif text-rose-800">Carrito Vacío</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-gray-600">Su carrito está vacío. Agregue productos para continuar con la compra.</p>
                  <Button onClick={() => router.push('/products')} className="bg-rose-600 hover:bg-rose-700">
                    Ver Productos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }
  
  // Render checkout form
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/products')}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Productos
            </Button>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="border-rose-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-t-lg">
                  <CardTitle className="text-2xl font-serif text-rose-800">Finalizar Compra</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {orderId && <PaymentForm orderId={orderId} />}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="border-rose-100 shadow-md sticky top-24">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-t-lg">
                  <CardTitle className="text-xl font-serif text-rose-800">Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="bg-rose-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-rose-800">
                            {item.quantity}
                          </div>
                          <span className="text-gray-700">{item.product.name}</span>
                        </div>
                        <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    
                    <Separator className="my-4 bg-rose-100" />
                    
                    <div className="flex justify-between items-center font-medium text-lg">
                      <span>Total:</span>
                      <span className="text-rose-700">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 