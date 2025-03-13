import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';
import { checkTilopayTransaction } from '@/lib/services/tilopay-service';
import { getOrderById } from '@/lib/services/order-service';
import { createClient } from '@supabase/supabase-js';

interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Helper function to get order details with admin client
async function getOrderDetailsWithAdmin(orderId: string, supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
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
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getOrderDetailsWithAdmin:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, cartData, tilopayResponse } = body;
    
    console.log('Updating Tilopay payment status for order:', orderId);
    console.log('Cart data:', cartData);
    console.log('Cart data user ID:', cartData.userId);
    console.log('Tilopay response:', tilopayResponse);
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!cartData) {
      return NextResponse.json(
        { success: false, error: 'Cart data is required' },
        { status: 400 }
      );
    }

    // Create admin client to bypass RLS
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
    
    // Determine payment status from Tilopay response
    let paymentStatus = 'pending';
    if (tilopayResponse) {
      console.log('Determining payment status from Tilopay response code:', tilopayResponse.code);
      paymentStatus = tilopayResponse.code === '1' ? 'paid' : 'failed';
    } else {
      // If no 3DS response, check status with Tilopay API
      const tilopayStatus = await checkTilopayTransaction(orderId);
      console.log('Tilopay transaction status:', tilopayStatus);
      
      if (!tilopayStatus.success) {
        console.error('Error checking Tilopay transaction status:', tilopayStatus.error);
        return NextResponse.json(
          { success: false, error: tilopayStatus.error },
          { status: 400 }
        );
      }
      
      paymentStatus = tilopayStatus.status === 'approved' || tilopayStatus.status === '1' ? 'paid' : 'failed';
    }

    console.log('Final payment status:', paymentStatus);
    let finalOrder;
    
    // Get the user ID from the cart data
    let userId = cartData.userId;
    
    // If no user ID in cart data, try to find a specific user
    if (!userId) {
      // Try to find the user by email if available in cart data
      if (cartData.customerEmail) {
        const { data: userByEmail } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', cartData.customerEmail)
          .maybeSingle();
          
        if (userByEmail) {
          userId = userByEmail.id;
          console.log('Found user ID by email:', userId);
        }
      }
      
      // If still no user ID, get a default user
      if (!userId) {
        // First, try to find a user with role 'customer'
        const { data: defaultUser } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('role', 'customer')
          .limit(1)
          .single();
        
        // Use the found user ID or a hardcoded one if not found
        userId = defaultUser?.id || '00000000-0000-0000-0000-000000000000';
        console.log('Using default user ID:', userId);
      }
    }
    
    // Log the exact user ID being used
    console.log('Final user ID for order:', userId);
    
    // Check if order exists - try multiple approaches
    let existingOrder = null;
    
    // First try with admin client
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
      
    if (!orderError && orderData) {
      existingOrder = orderData;
      console.log('Found existing order with admin client:', existingOrder.id);
      console.log('Existing order user ID:', existingOrder.user_id);
      
      // If the existing order has a different user ID than what we have now,
      // update it to use the correct user ID
      if (existingOrder.user_id !== userId && userId) {
        console.log('Updating order to use correct user ID. Old:', existingOrder.user_id, 'New:', userId);
        
        const { error: userUpdateError } = await supabaseAdmin
          .from('orders')
          .update({ user_id: userId })
          .eq('id', orderId);
          
        if (userUpdateError) {
          console.error('Error updating order user ID:', userUpdateError);
        } else {
          console.log('Successfully updated order user ID');
          existingOrder.user_id = userId;
        }
      }
    } else {
      console.log('Order not found with admin client, error:', orderError);
    }
    
    if (!existingOrder) {
      try {
        // Create the order in the database
        console.log('Creating new order in database with user ID:', userId);
        
        const orderData: OrderData = {
          id: orderId,
          user_id: userId,
          total_amount: cartData.total,
          status: 'pending', // Always start as pending
          payment_status: paymentStatus,
          transaction_id: tilopayResponse?.transactionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: newOrder, error: insertError } = await supabaseAdmin
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        
        if (insertError) {
          // If we get a duplicate key error, the order already exists
          if (insertError.code === '23505') {
            console.log('Order already exists (duplicate key), trying to update instead');
            
            // Try to get the order again
            const { data: existingOrderData } = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .maybeSingle();
              
            if (existingOrderData) {
              existingOrder = existingOrderData;
              console.log('Found existing order after duplicate key error:', existingOrder.id);
            } else {
              throw new Error('Order exists but could not be retrieved');
            }
          } else {
            throw insertError;
          }
        } else {
          finalOrder = newOrder;
          console.log('Order created successfully:', newOrder);
          
          // Create order items
          const orderItems = cartData.items.map((item: any) => ({
            order_id: orderId,
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price, // Using price instead of unit_price to match schema
            subtotal: item.product.price * item.quantity
          }));
          
          console.log('Creating order items:', orderItems);
          
          const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);
          
          if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Continue anyway, as the order was created successfully
          }
        }
      } catch (error: any) {
        console.error('Error in order creation process:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create order: ' + error.message },
          { status: 500 }
        );
      }
    }
    
    // If we found an existing order or got a duplicate key error, update it
    if (existingOrder) {
      // If the order is already paid, return success
      if (existingOrder.payment_status === 'paid') {
        console.log('Order already exists and is paid, returning success');
        
        // Get complete order details with items
        const completeOrderDetails = await getOrderDetailsWithAdmin(orderId, supabaseAdmin);
        
        return NextResponse.json({
          success: true,
          message: 'Order already processed',
          orderId: orderId,
          orderDetails: completeOrderDetails
        });
      }
      
      // Update existing order status
      console.log('Updating existing order:', existingOrder.id);
      
      try {
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: paymentStatus,
            status: 'pending', // Keep as pending until order is processed
            transaction_id: tilopayResponse?.transactionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating order status:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update order status: ' + updateError.message },
            { status: 500 }
          );
        }

        finalOrder = updatedOrder;
      } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update order: ' + error.message },
          { status: 500 }
        );
      }
    }
    
    // Create a payment record
    console.log('Creating payment record');
    
    try {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          order_id: orderId,
          payment_id: tilopayResponse?.transactionId || tilopayResponse?.auth,
          amount: finalOrder?.total_amount || cartData.total,
          currency: 'USD',
          status: paymentStatus,
          provider: 'tilopay',
          transaction_id: tilopayResponse?.transactionId,
          payment_method: 'credit_card',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue anyway, as the order status was updated successfully
      }
    } catch (error: any) {
      console.error('Error creating payment record:', error);
      // Continue anyway, as the order status was updated successfully
    }
    
    // Get complete order details with items using admin client
    let orderDetails = null;
    try {
      orderDetails = await getOrderDetailsWithAdmin(orderId, supabaseAdmin);
      
      if (!orderDetails) {
        // If we can't get the order details with the admin client, create a basic response
        console.log('Could not get order details with admin client, creating basic response');
        orderDetails = {
          id: orderId,
          status: paymentStatus,
          total_amount: finalOrder?.total_amount || cartData.total,
          payment_status: paymentStatus,
          created_at: new Date().toISOString(),
          items: cartData.items.map((item: any) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            subtotal: item.product.price * item.quantity,
            product: {
              name: item.product.name,
              image_url: item.product.image_url
            }
          }))
        };
      }
    } catch (error) {
      console.error('Error getting order details:', error);
      // If we can't get the order details, return a basic success response
      orderDetails = {
        id: orderId,
        status: paymentStatus,
        total_amount: finalOrder?.total_amount || cartData.total,
        payment_status: paymentStatus,
        created_at: new Date().toISOString(),
        items: cartData.items.map((item: any) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity,
          product: {
            name: item.product.name,
            image_url: item.product.image_url
          }
        }))
      };
    }
    
    console.log('Order processed successfully');
    return NextResponse.json({ 
      success: true,
      status: paymentStatus,
      transactionId: tilopayResponse?.transactionId || tilopayResponse?.auth,
      orderDetails
    });
  } catch (error: any) {
    console.error('Error updating Tilopay payment status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 