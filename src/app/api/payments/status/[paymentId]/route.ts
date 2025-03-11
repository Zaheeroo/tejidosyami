import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/services/payment-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    const result = await getPaymentStatus(paymentId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get payment status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { status: result.status },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error getting payment status:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 