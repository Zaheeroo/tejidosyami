import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define types for better type safety
interface CustomerInfo {
  email: string;
  name: string;
}

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

    // Get current date for the query
    const currentDate = new Date().toISOString();

    // Fetch only real orders (orders with dates up to now)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, image_url)
        )
      `)
      .lte('created_at', currentDate)  // Only get orders created before or at current time
      .order('created_at', { ascending: false });
      
    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found in the database');
      return NextResponse.json({
        success: true,
        orders: []
      });
    }

    // Process customer information for orders
    const processedOrders = await Promise.all(orders.map(async (order) => {
      if (order.user_id) {
        try {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
          
          if (!userError && userData && userData.user) {
            const user = userData.user;
            const userMetadata = user.user_metadata || {};
            
            order.customer = {
              email: user.email || userMetadata.email || 'Unknown',
              name: userMetadata.name || 
                    userMetadata.full_name || 
                    (userMetadata.first_name && userMetadata.last_name ? 
                      `${userMetadata.first_name} ${userMetadata.last_name}` : 
                      (userMetadata.firstName && userMetadata.lastName ? 
                        `${userMetadata.firstName} ${userMetadata.lastName}` : 'Unknown'))
            };
          } else {
            order.customer = { email: 'Unknown', name: 'Unknown' };
          }
        } catch (error) {
          console.warn(`Error fetching user for order ${order.id}:`, error);
          order.customer = { email: 'Unknown', name: 'Unknown' };
        }
      } else {
        order.customer = { email: 'Unknown', name: 'Unknown' };
      }
      return order;
    }));

    console.log(`Found ${processedOrders.length} real orders in the database`);
    
    return NextResponse.json({
      success: true,
      orders: processedOrders
    });
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 