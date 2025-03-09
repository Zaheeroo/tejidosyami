import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Try to get a user from user_roles table
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .limit(1);
    
    if (rolesError || !userRoles || userRoles.length === 0) {
      // If no user roles found, try to get from auth.users directly using raw SQL
      const { data: sqlUsers, error: sqlError } = await supabaseAdmin.rpc('execute_sql', {
        sql: `SELECT id FROM auth.users LIMIT 1;`
      });
      
      if (sqlError || !sqlUsers || sqlUsers.length === 0) {
        throw new Error('Could not find a valid user ID. Please ensure there are users in the system.');
      }
      
      var userId = sqlUsers[0].id;
    } else {
      var userId = userRoles[0].id;
    }
    
    console.log('Using user ID for test order:', userId);
    
    // Get a valid product ID
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id')
      .limit(1);
    
    if (productsError || !products || products.length === 0) {
      throw new Error('No products found in the system. Please create a product first.');
    }
    
    const productId = products[0].id;
    console.log('Using product ID for test order:', productId);
    
    // Generate a unique ID for the order
    const orderId = uuidv4();
    
    // Create a test order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        total_amount: 99.99,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (orderError) {
      throw new Error(`Error creating order: ${orderError.message}`);
    }
    
    // Create test order items
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        price: 99.99,
        subtotal: 99.99
      })
      .select();
    
    if (itemsError) {
      throw new Error(`Error creating order items: ${itemsError.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      order,
      orderItems,
      userId,
      productId
    });
  } catch (error: any) {
    console.error('Error creating test order:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 