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

    // Execute SQL to update RLS policies
    const { error: policyError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
        DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
        DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
        DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
        DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
        DROP POLICY IF EXISTS "Admins can update orders" ON orders;
        
        -- Policy for users to view their own orders
        CREATE POLICY "Users can view their own orders"
          ON orders
          FOR SELECT
          USING (auth.uid() = user_id);
        
        -- Policy for users to insert their own orders
        CREATE POLICY "Users can insert their own orders"
          ON orders
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        
        -- Policy for users to update their own orders
        CREATE POLICY "Users can update their own orders"
          ON orders
          FOR UPDATE
          USING (auth.uid() = user_id);
        
        -- Policy for admins to view all orders
        -- This uses a more flexible approach to detect admins
        CREATE POLICY "Admins can view all orders"
          ON orders
          FOR SELECT
          USING (
            (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
            auth.jwt() ->> 'email' LIKE '%admin%'
          );
        
        -- Policy for admins to insert orders
        CREATE POLICY "Admins can insert orders"
          ON orders
          FOR INSERT
          WITH CHECK (
            (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
            auth.jwt() ->> 'email' LIKE '%admin%'
          );
        
        -- Policy for admins to update orders
        CREATE POLICY "Admins can update orders"
          ON orders
          FOR UPDATE
          USING (
            (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
            auth.jwt() ->> 'email' LIKE '%admin%'
          );
      `
    });

    if (policyError) {
      throw new Error(`Error updating RLS policies: ${policyError.message}`);
    }

    // Also update the service role policy for the API endpoints
    const { error: serviceRoleError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        -- Policy for service role to manage all orders (for API endpoints)
        DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;
        CREATE POLICY "Service role can manage all orders"
          ON orders
          FOR ALL
          USING (auth.jwt() ->> 'role' = 'service_role');
          
        -- Also add a specific policy for service role to view all orders
        DROP POLICY IF EXISTS "Service role can view all orders" ON orders;
        CREATE POLICY "Service role can view all orders"
          ON orders
          FOR SELECT
          USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'supabase_admin');
          
        -- Add a policy for service role to view all order items
        DROP POLICY IF EXISTS "Service role can view all order items" ON order_items;
        CREATE POLICY "Service role can view all order items"
          ON order_items
          FOR SELECT
          USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'supabase_admin');
      `
    });

    if (serviceRoleError) {
      throw new Error(`Error updating service role policy: ${serviceRoleError.message}`);
    }

    // Also update the RLS policies for order_items to allow admins to view all order items
    const { error: orderItemsError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
        DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
        DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
        DROP POLICY IF EXISTS "Admins can insert order items" ON order_items;
        
        -- Policy for users to view their own order items
        CREATE POLICY "Users can view their own order items"
          ON order_items
          FOR SELECT
          USING (EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
          ));
        
        -- Policy for users to insert their own order items
        CREATE POLICY "Users can insert their own order items"
          ON order_items
          FOR INSERT
          WITH CHECK (EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
          ));
        
        -- Policy for admins to view all order items
        CREATE POLICY "Admins can view all order items"
          ON order_items
          FOR SELECT
          USING (
            (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
            auth.jwt() ->> 'email' LIKE '%admin%'
          );
        
        -- Policy for admins to insert order items
        CREATE POLICY "Admins can insert order items"
          ON order_items
          FOR INSERT
          WITH CHECK (
            (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
            auth.jwt() ->> 'email' LIKE '%admin%'
          );
      `
    });

    if (orderItemsError) {
      throw new Error(`Error updating order items RLS policies: ${orderItemsError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating RLS policies:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 