import { supabase } from '../supabase/supabase-client';
import { Product } from './product-service';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at?: string;
  product?: Product;
}

// Get user's wishlist
export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
  
  return data as WishlistItem[];
}

// Add item to wishlist
export async function addToWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlists')
    .insert({
      user_id: userId,
      product_id: productId
    });
    
  if (error) {
    // If error is about unique constraint, item is already in wishlist
    if (error.code === '23505') {
      return { alreadyExists: true };
    }
    console.error('Error adding to wishlist:', error);
    throw error;
  }
  
  return { success: true };
}

// Remove item from wishlist
export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
    
  if (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
  
  return { success: true };
}

// Check if product is in user's wishlist
export async function isInWishlist(userId: string, productId: string) {
  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error checking wishlist:', error);
    throw error;
  }
  
  return !!data;
}

// Get wishlist count
export async function getWishlistCount(userId: string) {
  const { count, error } = await supabase
    .from('wishlists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error getting wishlist count:', error);
    throw error;
  }
  
  return count || 0;
} 