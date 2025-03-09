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
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Check if this is a test payment with a test card
    const testCard = request.nextUrl.searchParams.get('testCard');
    
    // Get payment status from Onvopay
    const paymentStatus = await getPaymentStatus(paymentId, testCard || undefined);
    
    return NextResponse.json({
      success: true,
      status: paymentStatus.status,
      message: paymentStatus.message,
      paymentId: paymentStatus.paymentId,
      orderId: paymentStatus.orderId,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      transactionId: paymentStatus.transactionId
    });
    
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 