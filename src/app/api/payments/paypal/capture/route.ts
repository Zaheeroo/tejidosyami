import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalPayment } from '@/lib/services/paypal-service';
import { supabase } from '@/lib/supabase/supabase-client';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client with service role key
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalOrderId, shopOrderId } = body;
    
    console.log('PayPal capture API: Capturing payment for PayPal order ID:', paypalOrderId, 'Shop order ID:', shopOrderId);
    
    if (!paypalOrderId) {
      return NextResponse.json(
        { success: false, error: 'PayPal Order ID is required' },
        { status: 400 }
      );
    }
    
    if (!shopOrderId) {
      return NextResponse.json(
        { success: false, error: 'Shop Order ID is required' },
        { status: 400 }
      );
    }
    
    // Create admin client to bypass RLS
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Failed to create admin client' },
        { status: 500 }
      );
    }
    
    // Get cart data from localStorage (this would be sent from the client)
    let cartData;
    try {
      // In a real implementation, this would be sent from the client
      // Here we're simulating by getting it from the request body
      cartData = body.cartData;
      
      if (!cartData) {
        // Check if the order already exists in the database
        const { data: existingOrder, error: checkError } = await supabaseAdmin
          .from('orders')
          .select('id, payment_status')
          .eq('id', shopOrderId)
          .single();
        
        if (checkError) {
          console.error('Error checking if order exists:', checkError);
          return NextResponse.json(
            { success: false, error: 'Failed to check if order exists' },
            { status: 500 }
          );
        }
        
        // If the order exists and is already paid, return success
        if (existingOrder && existingOrder.payment_status === 'paid') {
          console.log('Order already exists and is paid, returning success');
          return NextResponse.json({
            success: true,
            message: 'Order already processed',
            orderId: shopOrderId
          });
        }
        
        // If the order exists but is not paid, we'll update it below
        if (!existingOrder) {
          return NextResponse.json(
            { success: false, error: 'Cart data is required and order does not exist' },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      console.error('Error parsing cart data:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid cart data' },
        { status: 400 }
      );
    }
    
    // Capture the payment with PayPal
    const captureResult = await capturePayPalPayment(paypalOrderId);
    
    if (!captureResult.success) {
      return NextResponse.json(
        { success: false, error: captureResult.error },
        { status: 400 }
      );
    }
    
    console.log('PayPal capture API: Payment captured successfully');
    
    // Check if the order already exists in the database
    const { data: existingOrder, error: checkError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', shopOrderId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking if order exists:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check if order exists' },
        { status: 500 }
      );
    }
    
    if (!existingOrder && cartData) {
      // Create the order in the database now that payment is confirmed
      console.log('Creating order in database after payment confirmation');
      
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          id: shopOrderId,
          user_id: cartData.userId,
          total_amount: cartData.total,
          status: 'completed',
          payment_status: 'paid',
          transaction_id: captureResult.transactionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        return NextResponse.json(
          { success: false, error: 'Failed to create order' },
          { status: 500 }
        );
      }
      
      // Create order items
      interface CartItem {
        product: {
          id: string;
          price: number;
        };
        quantity: number;
      }
      
      const orderItems = cartData.items.map((item: CartItem) => ({
        order_id: shopOrderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));
      
      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // If there's an error with order items, delete the order
        await supabaseAdmin.from('orders').delete().eq('id', shopOrderId);
        return NextResponse.json(
          { success: false, error: 'Failed to create order items' },
          { status: 500 }
        );
      }
    } else {
      // Update existing order status
      console.log('Updating existing order status in database');
      
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'completed',
          transaction_id: captureResult.transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopOrderId);
      
      if (orderError) {
        console.error('Error updating order status:', orderError);
        return NextResponse.json(
          { success: false, error: 'Failed to update order status' },
          { status: 500 }
        );
      }
    }
    
    console.log('PayPal capture API: Order created/updated successfully, creating payment record');
    
    // Create a payment record
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: shopOrderId,
        payment_id: paypalOrderId,
        amount: cartData ? cartData.total : 0,
        currency: 'USD',
        status: 'paid',
        provider: 'paypal',
        transaction_id: captureResult.transactionId,
        payment_method: 'paypal'
      });
    
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Continue anyway, as the order status was updated successfully
    }
    
    console.log('PayPal capture API: Payment process completed successfully');
    
    return NextResponse.json({
      success: true,
      captureId: captureResult.captureId,
      transactionId: captureResult.transactionId,
      status: captureResult.status
    });
    
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 