import { NextResponse } from 'next/server';
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

    // First, get all orders to identify test orders
    const { data: allOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, created_at');

    if (fetchError) {
      throw new Error(`Error fetching orders: ${fetchError.message}`);
    }

    // Identify test orders (orders with future dates or specific test IDs)
    const testOrderIds = allOrders?.filter(order => {
      if (!order.created_at) return true;
      const orderDate = new Date(order.created_at);
      const currentDate = new Date();
      return orderDate > currentDate;
    }).map(order => order.id) || [];

    console.log(`Found ${testOrderIds.length} test orders to delete`);

    if (testOrderIds.length > 0) {
      // First delete related order items
      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .in('order_id', testOrderIds);

      if (itemsError) {
        throw new Error(`Error deleting order items: ${itemsError.message}`);
      }

      // Then delete the orders
      const { error: ordersError } = await supabaseAdmin
        .from('orders')
        .delete()
        .in('id', testOrderIds);

      if (ordersError) {
        throw new Error(`Error deleting orders: ${ordersError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${testOrderIds.length} test orders and their items`
    });
  } catch (error: any) {
    console.error('Error cleaning up database:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 