import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';
import { updateOrderStatus } from '@/lib/services/order-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, status } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Map the status to the appropriate payment status
    let paymentStatus = 'pending';
    if (status === 'paid') {
      paymentStatus = 'paid';
    } else if (status === 'failed') {
      paymentStatus = 'failed';
    }
    
    // Update order status in database
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: paymentStatus,
        transaction_id: paymentId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      );
    }
    
    // Create a payment record if we have a payment ID
    if (paymentId) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_id: paymentId,
          amount: 0, // This will be updated with the actual amount from the order
          currency: 'USD',
          status: paymentStatus,
          provider: 'paypal',
          transaction_id: paymentId,
          payment_method: 'paypal'
        });
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue anyway, as the order status was updated successfully
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Order status updated successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 