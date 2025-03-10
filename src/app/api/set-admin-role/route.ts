import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
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
    
    // Update the user's metadata to set the admin role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role: 'admin' } }
    );
    
    if (error) {
      throw new Error(`Error updating user role: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'User role updated to admin successfully',
      user: data.user
    });
  } catch (error: any) {
    console.error('Error setting admin role:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 