import { NextRequest, NextResponse } from 'next/server';
import { checkTilopayTransaction } from '@/lib/services/tilopay-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }
    
    // Call Tilopay API to check transaction status
    const result = await checkTilopayTransaction(body.orderId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
        transactionId: result.transactionId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in Tilopay status check API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 