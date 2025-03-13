import { NextRequest, NextResponse } from 'next/server';
import { createTilopayPayment, TilopayOrderRequest } from '@/lib/services/tilopay-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'currency', 'orderId', 'customerEmail', 'returnUrl'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create payment request object
    const paymentRequest: TilopayOrderRequest = {
      amount: body.amount.toString(),
      currency: body.currency,
      orderNumber: body.orderId,
      description: body.description || `Payment for order ${body.orderId}`,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      redirectUrl: body.returnUrl
    };
    
    // Call Tilopay API to create payment URL
    const result = await createTilopayPayment(paymentRequest);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in Tilopay payment creation API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 