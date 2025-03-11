import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature as verifyOnvopaySignature, OnvopayWebhookPayload } from '@/lib/services/payment-service';
import { verifyWebhookSignature as verifyTilopaySignature, TilopayWebhookPayload } from '@/lib/services/tilopay-service';
import { supabase } from '@/lib/supabase/supabase-client';

export async function POST(request: NextRequest) {
  try {
    console.log('Received webhook request');
    
    const body = await request.json();
    
    // Determine the payment provider from the headers or payload
    const onvopaySignature = request.headers.get('x-onvopay-signature');
    const tilopaySignature = request.headers.get('x-tilopay-signature');
    const provider = body.provider || (tilopaySignature ? 'tilopay' : 'onvopay');
    
    console.log('Webhook payload:', body);
    console.log('Payment provider:', provider);
    
    let isValid = false;
    let orderId = '';
    let status = '';
    let transactionId = '';
    
    // Process based on the provider
    if (provider === 'tilopay') {
      console.log('Processing Tilopay webhook');
      console.log('Tilopay signature:', tilopaySignature);
      
      // Verify Tilopay webhook signature
      isValid = verifyTilopaySignature(body, tilopaySignature || '');
      
      if (!isValid) {
        console.error('Invalid Tilopay webhook signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      // Process the Tilopay webhook payload
      const payload = body as TilopayWebhookPayload;
      orderId = payload.orderId;
      status = payload.status;
      transactionId = payload.transactionId || '';
      
    } else {
      // Default to Onvopay
      console.log('Processing Onvopay webhook');
      console.log('Onvopay signature:', onvopaySignature);
      
      // Verify Onvopay webhook signature
      isValid = verifyOnvopaySignature(body, onvopaySignature || '');
      
      if (!isValid) {
        console.error('Invalid Onvopay webhook signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      // Process the Onvopay webhook payload
      const payload = body as OnvopayWebhookPayload;
      orderId = payload.orderId;
      status = payload.status;
      transactionId = payload.transactionId || '';
    }
    
    console.log('Processing webhook for order:', orderId);
    
    // Update order status in database based on payment status
    if (status === 'completed') {
      console.log('Payment completed, updating order status');
      
      // Payment was successful, update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          transaction_id: transactionId,
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
      
      // Create a payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_id: transactionId,
          amount: body.amount || 0,
          currency: body.currency || 'USD',
          status: 'paid',
          provider: provider,
          transaction_id: transactionId,
          payment_method: 'credit_card'
        });
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue anyway, as the order status was updated successfully
      }
      
      // You might want to trigger other actions here like:
      // - Sending confirmation email
      // - Updating inventory
      // - Creating invoice
      
    } else if (status === 'failed') {
      console.log('Payment failed, updating order status');
      
      // Payment failed, update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'failed',
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