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
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, image_url)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      orders: data
    });
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 