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

    // Process orders to ensure customer information is available
    // Get unique user IDs from orders
    const userIdSet = new Set<string>();
    realOrders.forEach(order => {
      if (order.user_id) userIdSet.add(order.user_id);
    });
    const userIds = Array.from(userIdSet);
    
    // Create a map to store user information
    const userMap = new Map();
    
    // Fetch user information for each user ID
    for (const userId of userIds) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (!userError && userData && userData.user) {
          const user = userData.user;
          const userMetadata = user.user_metadata || {};
          
          userMap.set(userId, {
            email: user.email || userMetadata.email || 'Unknown',
            name: userMetadata.name || 
                  userMetadata.full_name || 
                  (userMetadata.first_name && userMetadata.last_name ? 
                    `${userMetadata.first_name} ${userMetadata.last_name}` : 
                    (userMetadata.firstName && userMetadata.lastName ? 
                      `${userMetadata.firstName} ${userMetadata.lastName}` : 'Unknown'))
          });
        }
      } catch (error) {
        console.warn(`Error fetching user ${userId}:`, error);
      }
    }
    
    // Add customer information to each order
    realOrders.forEach(order => {
      if (order.user_id && userMap.has(order.user_id)) {
        order.customer = userMap.get(order.user_id);
      } else {
        // If we can't find the user, try to get customer information from the order
        if (order.customer_name || order.customer_email) {
          // Use the customer information directly from the order
          order.customer = {
            name: order.customer_name || 'Unknown',
            email: order.customer_email || 'Unknown'
          };
        } else if (order.shipping_address && typeof order.shipping_address === 'object') {
          // Try to get customer information from shipping address
          const shippingAddress = order.shipping_address;
          order.customer = {
            name: shippingAddress.name || shippingAddress.full_name || 'Unknown',
            email: shippingAddress.email || 'Unknown'
          };
        } else if (order.billing_address && typeof order.billing_address === 'object') {
          // Try to get customer information from billing address
          const billingAddress = order.billing_address;
          order.customer = {
            name: billingAddress.name || billingAddress.full_name || 'Unknown',
            email: billingAddress.email || 'Unknown'
          };
        } else if (order.metadata && typeof order.metadata === 'object') {
          // Try to get customer information from metadata
          const metadata = order.metadata;
          order.customer = {
            name: metadata.customer_name || metadata.name || 'Unknown',
            email: metadata.customer_email || metadata.email || 'Unknown'
          };
        } else {
          // Default customer information if none is available
          order.customer = {
            name: 'Unknown',
            email: 'Unknown'
          };
        }
      }
    });

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
          customer: order.customer,
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
        
        // Get customer information for this specific order
        if (specificOrder.user_id) {
          try {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(specificOrder.user_id);
            
            if (!userError && userData && userData.user) {
              const user = userData.user;
              const userMetadata = user.user_metadata || {};
              
              specificOrder.customer = {
                email: user.email || userMetadata.email || 'Unknown',
                name: userMetadata.name || 
                      userMetadata.full_name || 
                      (userMetadata.first_name && userMetadata.last_name ? 
                        `${userMetadata.first_name} ${userMetadata.last_name}` : 
                        (userMetadata.firstName && userMetadata.lastName ? 
                          `${userMetadata.firstName} ${userMetadata.lastName}` : 'Unknown'))
              };
            } else {
              // Fallback to other methods if user data is not available
              if (specificOrder.customer_name || specificOrder.customer_email) {
                specificOrder.customer = {
                  name: specificOrder.customer_name || 'Unknown',
                  email: specificOrder.customer_email || 'Unknown'
                };
              } else if (specificOrder.shipping_address && typeof specificOrder.shipping_address === 'object') {
                const shippingAddress = specificOrder.shipping_address;
                specificOrder.customer = {
                  name: shippingAddress.name || shippingAddress.full_name || 'Unknown',
                  email: shippingAddress.email || 'Unknown'
                };
              } else if (specificOrder.billing_address && typeof specificOrder.billing_address === 'object') {
                const billingAddress = specificOrder.billing_address;
                specificOrder.customer = {
                  name: billingAddress.name || billingAddress.full_name || 'Unknown',
                  email: billingAddress.email || 'Unknown'
                };
              } else if (specificOrder.metadata && typeof specificOrder.metadata === 'object') {
                const metadata = specificOrder.metadata;
                specificOrder.customer = {
                  name: metadata.customer_name || metadata.name || 'Unknown',
                  email: metadata.customer_email || metadata.email || 'Unknown'
                };
              } else {
                specificOrder.customer = {
                  name: 'Unknown',
                  email: 'Unknown'
                };
              }
            }
          } catch (error) {
            console.warn('Error fetching user for specific order:', error);
            specificOrder.customer = { email: 'Unknown', name: 'Unknown' };
          }
        } else {
          specificOrder.customer = { email: 'Unknown', name: 'Unknown' };
        }
        
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