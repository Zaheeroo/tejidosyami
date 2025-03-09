import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, OnvopayWebhookPayload } from '@/lib/services/payment-service';
import { supabase } from '@/lib/supabase/supabase-client';

export async function POST(request: NextRequest) {
  try {
    console.log('Received webhook request');
    
    const body = await request.json();
    const signature = request.headers.get('x-onvopay-signature') || '';
    
    console.log('Webhook payload:', body);
    console.log('Webhook signature:', signature);
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Process the webhook payload
    const payload = body as OnvopayWebhookPayload;
    
    console.log('Processing webhook for order:', payload.orderId);
    
    // Update order status in database based on payment status
    if (payload.status === 'completed') {
      console.log('Payment completed, updating order status');
      
      // Payment was successful, update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          transaction_id: payload.transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update order status' },
          { status: 500 }
        );
      }
      
      // You might want to trigger other actions here like:
      // - Sending confirmation email
      // - Updating inventory
      // - Creating invoice
      
    } else if (payload.status === 'failed') {
      console.log('Payment failed, updating order status');
      
      // Payment failed, update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.orderId);
      
      if (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update order status' },
          { status: 500 }
        );
      }
    }
    
    // Return success response
    console.log('Webhook processed successfully');
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 