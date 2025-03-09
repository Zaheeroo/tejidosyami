import { NextResponse } from 'next/server';
import { getOrders, Order } from '@/lib/services/order-service';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY is not defined'
      }, { status: 500 });
    }
    
    // Create a Supabase client with the service role key for admin privileges
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Try to get orders using the order service
    let ordersFromService: Order[] = [];
    let serviceError: string | null = null;
    try {
      ordersFromService = await getOrders();
    } catch (error: any) {
      serviceError = error.message;
    }
    
    // Also try to query the orders table directly
    const { data: directOrders, error: directError } = await supabaseAdmin
      .from('orders')
      .select('*');
    
    return NextResponse.json({
      success: true,
      ordersFromService,
      serviceError,
      ordersFromDirect: directOrders,
      directError: directError ? directError.message : null
    });
  } catch (error: any) {
    console.error('Error in test-orders API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 