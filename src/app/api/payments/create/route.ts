import { NextRequest, NextResponse } from 'next/server';
import { createPayment as createOnvopayPayment, OnvopayPaymentRequest } from '@/lib/services/payment-service';
import * as TilopayAPI from '@/lib/services/tilopay-api';

// Helper function to handle CORS
function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// Handle OPTIONS requests (preflight)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || 'http://localhost:3001';
  
  return new NextResponse(null, {
    status: 200, // Use 200 instead of 204 for better compatibility
    headers: corsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  // Add CORS headers to the response
  const origin = request.headers.get('origin') || 'http://localhost:3001';
  const headers = corsHeaders(origin);
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['amount', 'currency', 'orderId', 'customerEmail', 'redirectUrl', 'callbackUrl'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400, headers }
        );
      }
    }
    
    // Determine which payment provider to use
    const provider = body.provider || 'onvopay';
    
    if (provider === 'tilopay') {
      // Create Tilopay payment request object
      const paymentRequest: TilopayAPI.TilopayPaymentRequest = {
        amount: body.amount,
        currency: body.currency,
        orderId: body.orderId,
        description: body.description || `Payment for order ${body.orderId}`,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        customerLastName: body.customerLastName,
        customerAddress: body.customerAddress,
        customerCity: body.customerCity,
        customerState: body.customerState,
        customerZip: body.customerZip,
        customerCountry: body.customerCountry,
        customerPhone: body.customerPhone,
        redirectUrl: body.redirectUrl,
        callbackUrl: body.callbackUrl,
        testMode: body.testMode,
        testCardNumber: body.testCardNumber
      };
      
      // Call Tilopay API to create payment
      const result = await TilopayAPI.createPayment(paymentRequest);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          paymentUrl: result.paymentUrl,
          paymentId: result.paymentId
        }, { headers });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400, headers }
        );
      }
    } else {
      // Default to Onvopay
      // Create Onvopay payment request object
      const paymentRequest: OnvopayPaymentRequest = {
        amount: body.amount,
        currency: body.currency,
        orderId: body.orderId,
        description: body.description || `Payment for order ${body.orderId}`,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        redirectUrl: body.redirectUrl,
        callbackUrl: body.callbackUrl,
        testMode: body.testMode,
        testCardNumber: body.testCardNumber
      };
      
      // Call Onvopay API to create payment
      const result = await createOnvopayPayment(paymentRequest);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          paymentUrl: result.paymentUrl,
          paymentId: result.paymentId
        }, { headers });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400, headers }
        );
      }
    }
  } catch (error: any) {
    console.error('Error in payment creation API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
} 