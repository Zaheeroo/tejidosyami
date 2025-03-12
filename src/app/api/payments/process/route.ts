import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';

// Test card scenarios
const TEST_CARD_SCENARIOS = {
  '4242424242424242': { status: 'completed', paymentStatus: 'paid', message: 'Payment successful' },
  '4111111111111111': { status: 'failed', paymentStatus: 'failed', message: 'Insufficient funds' },
  '5555555555554444': { status: 'failed', paymentStatus: 'failed', message: 'Try again later' },
  '5454545454545454': { status: 'failed', paymentStatus: 'failed', message: 'Stolen card' },
  '378282246310005': { status: 'failed', paymentStatus: 'failed', message: 'Authentication failed' },
  '6011111111111117': { status: 'failed', paymentStatus: 'failed', message: 'Expired card' },
  '3566111111111113': { status: 'failed', paymentStatus: 'failed', message: 'Invalid card number' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, mockPayment, testCard } = body;
    
    console.log('Processing payment server-side:', { orderId, paymentId, mockPayment, testCard });
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // If this is a mock payment, update the order status
    if (mockPayment === 'true' && orderId && paymentId) {
      let paymentStatus = 'paid';
      let message = 'Payment successful';
      
      // If this is a test card payment, use the appropriate status
      if (testCard) {
        const cleanCardNumber = testCard.replace(/\s/g, '');
        const scenario = TEST_CARD_SCENARIOS[cleanCardNumber as keyof typeof TEST_CARD_SCENARIOS];
        
        if (scenario) {
          paymentStatus = scenario.paymentStatus;
          message = scenario.message;
          console.log(`Using test card scenario for ${cleanCardNumber}:`, scenario);
        }
      }
      
      // Update order status based on payment result
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: paymentStatus,
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
      
      // Create a payment record
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
          payment_method: testCard ? 'test_card' : 'paypal'
        });
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue anyway, as the order status was updated successfully
      }
      
      console.log('Order status updated successfully');
      return NextResponse.json({ 
        success: true,
        paymentStatus,
        message
      });
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