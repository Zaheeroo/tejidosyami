import { supabase } from '../supabase/supabase-client';

export interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  stock: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return data as Product[];
}

export async function getProductById(id: string) {
  // Add timestamp to avoid caching issues
  const timestamp = new Date().getTime();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
  
  // Ensure we're returning the most up-to-date data
  console.log(`Fetched product at ${timestamp}:`, data);
  return data as Product;
}

export async function getProductsByCategory(category: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('name');
    
  if (error) {
    console.error(`Error fetching products in category ${category}:`, error);
    throw error;
  }
  
  return data as Product[];
}

export async function createProduct(product: Product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }
  
  return data as Product;
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error(`Error updating product with id ${id}:`, error);
    throw error;
  }
  
  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error(`Error deleting product with id ${id}:`, error);
    throw error;
  }
  
  return true;
}

export async function searchProducts(query: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .order('name');
    
  if (error) {
    console.error(`Error searching products with query ${query}:`, error);
    throw error;
  }
  
  return data as Product[];
} 