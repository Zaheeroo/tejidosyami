import { NextRequest, NextResponse } from 'next/server';
import { createPayment, OnvopayPaymentRequest } from '@/lib/services/payment-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'currency', 'orderId', 'customerEmail', 'redirectUrl', 'callbackUrl'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create payment request object
    const paymentRequest: OnvopayPaymentRequest = {
      amount: body.amount,
      currency: body.currency,
      orderId: body.orderId,
      description: body.description || `Payment for order ${body.orderId}`,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      redirectUrl: body.redirectUrl,
      callbackUrl: body.callbackUrl
    };
    
    // Call Onvopay API to create payment
    const result = await createPayment(paymentRequest);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in payment creation API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 