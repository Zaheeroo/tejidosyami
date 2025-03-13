import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';
import { updateOrderStatus } from '@/lib/services/order-service';
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

    // Create admin client to bypass RLS
    const supabaseAdmin = createAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Failed to create admin client' },
        { status: 500 }
      );
    }
    
    // Map the status to the appropriate payment status
    let paymentStatus = 'pending';
    if (status === 'paid') {
      paymentStatus = 'paid';
    } else if (status === 'failed') {
      paymentStatus = 'failed';
    }
    
    // Update order status in database using admin client
    const { error } = await supabaseAdmin
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
    
    // Create a payment record if we have a payment ID using admin client
    if (paymentId) {
      // First check if payment record already exists
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('order_id', orderId)
        .eq('payment_id', paymentId)
        .single();

      // Only create payment record if it doesn't exist
      if (!existingPayment) {
        const { error: paymentError } = await supabaseAdmin
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