import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalPayment } from '@/lib/services/paypal-service';
import { supabase } from '@/lib/supabase/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalOrderId, shopOrderId } = body;
    
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
    
    // Capture the payment with PayPal
    const captureResult = await capturePayPalPayment(paypalOrderId);
    
    if (!captureResult.success) {
      return NextResponse.json(
        { success: false, error: captureResult.error },
        { status: 400 }
      );
    }
    
    // Update order status in database
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
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
    
    // Create a payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: shopOrderId,
        payment_id: paypalOrderId,
        amount: 0, // This will be updated with the actual amount from the order
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