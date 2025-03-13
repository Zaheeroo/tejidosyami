import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching for this route
export const revalidate = 0; // Disable caching for this route

export async function GET() {
  try {
    console.log('GET /api/admin/get-order-count - Starting request');
    
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Supabase admin client created, fetching order count...');

    // Use a simpler query that doesn't rely on relationships
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting order count:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Ensure count is a number
    const orderCount = count !== null ? count : 0;
    
    console.log(`Successfully fetched order count: ${orderCount}`);
    
    // Return the actual count from the database
    const response = NextResponse.json({ success: true, count: orderCount });
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error: any) {
    console.error('Error in get-order-count route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 