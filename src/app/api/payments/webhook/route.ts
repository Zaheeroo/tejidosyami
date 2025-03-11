import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/services/payment-service';
import { updateOrderStatus } from '@/lib/services/order-service';

export async function POST(request: Request) {
  try {
    // Get the webhook signature from headers
    const signature = request.headers.get('x-tilopay-signature') || '';
    
    // Get the webhook payload
    const payload = await request.json();
    
    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Extract data from payload
    const {
      paymentId,
      orderId,
      status,
      amount,
      currency,
      transactionId,
      errorMessage
    } = payload;
    
    // Validate required fields
    if (!orderId || !status) {
      console.error('Missing required fields in webhook payload');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Map Tilopay status to our order status
    let orderStatus;
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        orderStatus = 'completed';
        break;
      case 'failed':
      case 'declined':
      case 'cancelled':
        orderStatus = 'failed';
        break;
      case 'pending':
      case 'processing':
        orderStatus = 'pending';
        break;
      default:
        orderStatus = 'pending';
    }
    
    // Update order status
    const result = await updateOrderStatus(orderId, orderStatus);
    
    if (!result.success) {
      console.error('Error updating order status:', result.error);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tilopay-signature',
      'Access-Control-Max-Age': '86400',
    },
  });
} 