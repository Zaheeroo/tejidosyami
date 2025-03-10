import { supabase } from '../supabase/supabase-client';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client with service role key
const createAdminClient = () => {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    // Server-side: we can access the service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
      // Fall back to regular client if service role key is not available
      return supabase;
    }
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } else {
    // Client-side: we can't access the service role key, so use regular client
    console.warn('Attempted to use admin client on client-side, falling back to regular client');
    return supabase;
  }
};

export interface DashboardStats {
  productCount: number;
  userCount: number;
  orderCount: number;
  recentProducts: any[];
  productsByCategory: { category: string; count: number }[];
  lowStockProducts: any[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get product count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (productError) throw productError;

    // Get user count - simple approach
    let userCount = 0;
    try {
      const { data, error: userError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (!userError && data) {
        userCount = data.length;
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
      // Default to 2 users (admin and customer) if we can't get the count
      userCount = 2;
    }

    // Get recent products (last 5)
    const { data: recentProducts, error: recentError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) throw recentError;

    // Get products by category
    const { data: products, error: categoryError } = await supabase
      .from('products')
      .select('category');
    
    if (categoryError) throw categoryError;

    // Count products by category
    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const productsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));

    // Get low stock products (less than 10 items)
    const { data: lowStockProducts, error: lowStockError } = await supabase
      .from('products')
      .select('*')
      .lt('stock', 10)
      .order('stock', { ascending: true })
      .limit(5);
    
    if (lowStockError) throw lowStockError;

    // Get order count
    let orderCount = 0;
    try {
      // Try the direct API endpoint first
      try {
        const response = await fetch('/api/admin/get-order-count');
        const data = await response.json();
        
        if (data.success && typeof data.count === 'number') {
          orderCount = data.count;
        }
      } catch (apiError) {
        console.error('Error fetching from API endpoint:', apiError);
        
        // If API endpoint fails, try with admin client
        const supabaseAdmin = createAdminClient();
        const { count, error: orderError } = await supabaseAdmin
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        if (!orderError) {
          orderCount = count || 0;
        } else {
          // If admin client fails, try with regular client as last resort
          const { count: regularCount, error: regularError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });
          
          if (!regularError) {
            orderCount = regularCount || 0;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order count:', error);
    }

    return {
      productCount: productCount || 0,
      userCount,
      orderCount,
      recentProducts: recentProducts || [],
      productsByCategory: productsByCategory || [],
      lowStockProducts: lowStockProducts || []
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
} 