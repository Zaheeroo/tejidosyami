import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, mockPayment } = body;
    
    console.log('Processing payment server-side:', { orderId, paymentId, mockPayment });
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // If this is a mock payment, update the order status
    if (mockPayment === 'true' && orderId && paymentId) {
      // Update order status to paid
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          transaction_id: paymentId,
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
      
      console.log('Order status updated successfully');
      return NextResponse.json({ success: true });
    }
    
    // For real payments, we would process the payment here
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 