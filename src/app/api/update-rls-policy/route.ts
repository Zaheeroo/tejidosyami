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
        CREATE POLICY "Admins can view all orders"
          ON orders
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        -- Policy for admins to insert orders
        CREATE POLICY "Admins can insert orders"
          ON orders
          FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        -- Policy for admins to update orders
        CREATE POLICY "Admins can update orders"
          ON orders
          FOR UPDATE
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE id = auth.uid() AND role = 'admin'
            )
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
      `
    });

    if (serviceRoleError) {
      throw new Error(`Error updating service role policy: ${serviceRoleError.message}`);
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