import { supabase } from '../supabase/supabase-client';
import { CartItem } from './cart-service';
import { v4 as uuidv4 } from 'uuid';

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

// Get all orders (admin only)
export async function getOrders() {
  const { data, error } = await supabase
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
    console.error('Error fetching orders:', error);
    throw error;
  }
  
  return data as Order[];
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
export async function updateOrderStatus(orderId: string, status: string, paymentStatus?: string, transactionId?: string) {
  const updates: any = { status };
  
  if (paymentStatus) {
    updates.payment_status = paymentStatus;
  }
  
  if (transactionId) {
    updates.transaction_id = transactionId;
  }
  
  updates.updated_at = new Date().toISOString();
  
  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);
    
  if (error) {
    console.error(`Error updating order ${orderId}:`, error);
    throw error;
  }
  
  return true;
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