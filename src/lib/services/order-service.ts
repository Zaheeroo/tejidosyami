import { supabase } from '../supabase/supabase-client';
import { CartItem } from './cart-service';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  transaction_id?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  customer?: {
    name: string;
    email: string;
  };
  shipping_address?: any;
  billing_address?: any;
  metadata?: any;
  customer_name?: string;
  customer_email?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  order_id: string;
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

// Create a new order from cart items
export async function createOrder(userId: string, cartItems: CartItem[], totalAmount: number) {
  // Generate a unique ID for the order
  const orderId = uuidv4();
  
  // Start a transaction
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: userId,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending'
    });
    
  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }
  
  // Create order items
  const orderItems = cartItems.map(item => ({
    order_id: orderId,
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.product.price,
    subtotal: item.product.price * item.quantity
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
    
  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // If there's an error with order items, we should delete the order
    await supabase.from('orders').delete().eq('id', orderId);
    throw itemsError;
  }
  
  return orderId;
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const response = await fetch('/api/admin/update-order-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      status
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to update order status');
  }
  
  return data.order;
}

// Create a payment record for an order
export async function createPaymentRecord(orderId: string, paymentId: string, amount: number, currency: string, status: string, provider: string = 'paypal', transactionId?: string, paymentMethod?: string) {
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