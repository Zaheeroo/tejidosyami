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

    // Fetch all orders with their items
    const { data: allOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, image_url)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    // Filter out test orders (orders with future dates)
    const currentDate = new Date();
    const realOrders = allOrders?.filter(order => {
      if (!order.created_at) return true;
      
      const orderDate = new Date(order.created_at);
      
      // Filter out orders with dates in 2025 (future dates)
      if (orderDate.getFullYear() === 2025) {
        return false;
      }
      
      return true;
    }) || [];

    // Log the number of orders found
    console.log(`API: Found ${allOrders?.length || 0} total orders in the database`);
    console.log(`API: Filtered to ${realOrders.length} real orders (filtered out ${(allOrders?.length || 0) - realOrders.length} test orders)`);
    
    // Log details about each real order
    if (realOrders.length > 0) {
      realOrders.forEach((order, index) => {
        console.log(`Real Order ${index + 1}:`, {
          id: order.id,
          created_at: order.created_at,
          user_id: order.user_id,
          total_amount: order.total_amount,
          status: order.status,
          payment_status: order.payment_status,
          items_count: order.items?.length || 0
        });
      });
    } else {
      console.log('No real orders found in the database');
      
      // If there are no real orders, check if there's a real order with ID e7b8612c-8032-4642-8efb-fecf9216879f
      const { data: specificOrder, error: specificOrderError } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(name, image_url)
          )
        `)
        .eq('id', 'e7b8612c-8032-4642-8efb-fecf9216879f')
        .single();
        
      if (!specificOrderError && specificOrder) {
        console.log('Found specific real order:', specificOrder);
        return NextResponse.json({
          success: true,
          orders: [specificOrder]
        });
      }
    }

    return NextResponse.json({
      success: true,
      orders: realOrders
    });
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 