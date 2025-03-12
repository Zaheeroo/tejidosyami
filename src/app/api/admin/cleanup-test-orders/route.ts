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

    // First, get all orders to see how many we have
    const { data: beforeOrders, error: beforeError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false });
      
    if (beforeError) {
      throw new Error(`Error fetching orders: ${beforeError.message}`);
    }
    
    const beforeCount = beforeOrders?.length || 0;
    console.log(`Before cleanup: Found ${beforeCount} orders in the database`);
    
    // Keep only the most recent order (assuming it's the real one)
    // and delete all others
    if (beforeCount > 1) {
      // Get the most recent order ID
      const mostRecentOrderId = beforeOrders[0].id;
      
      // Delete all order items for orders except the most recent one
      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .not('order_id', 'eq', mostRecentOrderId);
        
      if (itemsError) {
        throw new Error(`Error deleting order items: ${itemsError.message}`);
      }
      
      // Delete all orders except the most recent one
      const { error: ordersError } = await supabaseAdmin
        .from('orders')
        .delete()
        .not('id', 'eq', mostRecentOrderId);
        
      if (ordersError) {
        throw new Error(`Error deleting orders: ${ordersError.message}`);
      }
    }
    
    // Check how many orders we have now
    const { data: afterOrders, error: afterError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false });
      
    if (afterError) {
      throw new Error(`Error fetching orders after cleanup: ${afterError.message}`);
    }
    
    const afterCount = afterOrders?.length || 0;
    console.log(`After cleanup: Found ${afterCount} orders in the database`);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up orders. Before: ${beforeCount}, After: ${afterCount}`,
      ordersRemoved: beforeCount - afterCount
    });
  } catch (error: any) {
    console.error('Error cleaning up orders:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 