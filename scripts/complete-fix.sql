-- 1. Disable RLS temporarily to allow us to fix things
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow admin full access" ON public.products;

-- 3. Ensure admin and customer users have the correct roles
-- First, make sure the user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Find admin users by email pattern and ensure they have the admin role
INSERT INTO public.user_roles (id, role)
SELECT id, 'admin' as role
FROM auth.users
WHERE email LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Find customer users by email pattern and ensure they have the customer role
INSERT INTO public.user_roles (id, role)
SELECT id, 'customer' as role
FROM auth.users
WHERE email NOT LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

-- 4. Create a function to check if a user is an admin
-- This avoids the recursion issue by using a function instead of a direct query
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role directly without using policies
  SELECT role INTO user_role FROM public.user_roles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. Create new policies using the function
-- For user_roles table
CREATE POLICY "Users can view their own role" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles FOR ALL 
  USING (public.is_admin());

-- For products table
CREATE POLICY "Allow public read access" 
  ON public.products FOR SELECT 
  USING (true);

CREATE POLICY "Allow admin full access" 
  ON public.products FOR ALL 
  USING (public.is_admin());

-- 7. Verify the user_roles table has entries
SELECT * FROM public.user_roles; 