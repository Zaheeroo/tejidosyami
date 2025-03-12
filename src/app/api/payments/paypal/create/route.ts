import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder, PayPalOrderRequest } from '@/lib/services/paypal-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'currency', 'orderId', 'customerEmail', 'returnUrl', 'cancelUrl'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create payment request object
    const paymentRequest: PayPalOrderRequest = {
      amount: body.amount,
      currency: body.currency,
      orderId: body.orderId,
      description: body.description || `Payment for order ${body.orderId}`,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl
    };
    
    // Call PayPal API to create order
    const result = await createPayPalOrder(paymentRequest);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId: result.orderId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in PayPal order creation API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 