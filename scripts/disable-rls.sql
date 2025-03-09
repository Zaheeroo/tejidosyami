-- This is a temporary solution to get things working
-- It disables Row Level Security completely, which means no access control
-- Only use this for development/testing purposes

-- Disable RLS on user_roles table
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on products table
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow admin full access" ON public.products;

-- Ensure the products table exists
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample products if the table is empty
INSERT INTO public.products (name, description, price, image_url, stock, category)
SELECT 'Classic T-Shirt', 'A comfortable cotton t-shirt for everyday wear.', 19.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHNoaXJ0fGVufDB8fDB8fHww', 100, 'Clothing'
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

-- Insert more sample products
INSERT INTO public.products (name, description, price, image_url, stock, category)
SELECT 'Denim Jeans', 'Classic blue denim jeans with a straight fit.', 49.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amVhbnN8ZW58MHx8MHx8fDA%3D', 50, 'Clothing'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Denim Jeans');

INSERT INTO public.products (name, description, price, image_url, stock, category)
SELECT 'Leather Wallet', 'Genuine leather wallet with multiple card slots.', 29.99, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2FsbGV0fGVufDB8fDB8fHww', 30, 'Accessories'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Leather Wallet');

INSERT INTO public.products (name, description, price, image_url, stock, category)
SELECT 'Wireless Headphones', 'Bluetooth headphones with noise cancellation.', 99.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D', 20, 'Electronics'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Wireless Headphones');

-- Verify tables
SELECT 'Products count:' as info, COUNT(*) FROM public.products; 