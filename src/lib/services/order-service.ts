import { supabase } from '../supabase/supabase-client';
import { CartItem } from './cart-service';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { createPayment } from './payment-service';

export interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  customerName?: string;
  customerLastName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerCountry?: string;
  customerPhone?: string;
  description?: string;
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at?: string;
  product?: {
    name: string;
    image_url?: string;
  };
}

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

// Get all orders (admin only)
export async function getOrders() {
  try {
    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();
    
    // First try with admin client
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, image_url)
        ),
        customer:users(
          email,
          name:raw_user_meta_data->name
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching orders with admin client:', error);
      
      // If admin client fails, try with regular client (will work if RLS policies are set up correctly)
      console.log('Falling back to regular client...');
      const { data: regularData, error: regularError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(name, image_url)
          ),
          customer:users(
            email,
            name:raw_user_meta_data->name
          )
        `)
        .order('created_at', { ascending: false });
        
      if (regularError) {
        console.error('Error fetching orders with regular client:', regularError);
        throw regularError;
      }
      
      return regularData as Order[];
    }
    
    return data as Order[];
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
}

// Get orders for a specific user
export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(name, image_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    throw error;
  }
  
  return data as Order[];
}

// Get a specific order by ID
export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(name, image_url)
      )
    `)
    .eq('id', orderId)
    .single();
    
  if (error) {
    console.error(`Error fetching order with id ${orderId}:`, error);
    throw error;
  }
  
  return data as Order;
}

// Get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

// Create a new order
export async function createOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{
  success: boolean;
  order?: Order;
  paymentUrl?: string;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  
  try {
    // Generate order ID
    const orderId = `order_${Date.now()}`;
    
    // Create order in database
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .insert([
        {
          id: orderId,
          ...orderData,
          status: 'pending'
        }
      ])
      .select()
      .single();
      
    if (dbError) throw dbError;
    if (!order) throw new Error('Failed to create order');
    
    // Create payment with Tilopay
    const paymentResponse = await createPayment({
      amount: orderData.amount,
      currency: orderData.currency,
      orderId: orderId,
      customerEmail: orderData.customerEmail,
      customerName: orderData.customerName,
      customerLastName: orderData.customerLastName,
      customerAddress: orderData.customerAddress,
      customerCity: orderData.customerCity,
      customerState: orderData.customerState,
      customerZip: orderData.customerZip,
      customerCountry: orderData.customerCountry,
      customerPhone: orderData.customerPhone,
      description: orderData.description,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${orderId}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
    });
    
    if (!paymentResponse.success) {
      throw new Error(paymentResponse.error || 'Payment creation failed');
    }
    
    // Update order with payment ID
    if (paymentResponse.paymentId) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ paymentId: paymentResponse.paymentId })
        .eq('id', orderId);
        
      if (updateError) {
        console.error('Error updating order with payment ID:', updateError);
      }
    }
    
    return {
      success: true,
      order,
      paymentUrl: paymentResponse.paymentUrl
    };
    
  } catch (error: any) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create order'
    };
  }
}

// Get order by ID
export async function getOrder(orderId: string): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (error) throw error;
    if (!order) throw new Error('Order not found');
    
    return {
      success: true,
      order
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get order'
    };
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
      
    if (error) throw error;
    if (!order) throw new Error('Order not found');
    
    return {
      success: true,
      order
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update order status'
    };
  }
}

// Create a payment record for an order
export async function createPaymentRecord(orderId: string, paymentId: string, amount: number, currency: string, status: string, provider: string = 'onvopay', transactionId?: string, paymentMethod?: string) {
  const { error } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      payment_id: paymentId,
      amount,
      currency,
      status,
      provider,
      transaction_id: transactionId,
      payment_method: paymentMethod
    });
    
  if (error) {
    console.error(`Error creating payment record for order ${orderId}:`, error);
    throw error;
  }
  
  return true;
} 