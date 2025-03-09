-- 1. Fix the user_roles table policies to avoid infinite recursion

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create a temporary policy to allow this script to work
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;
CREATE POLICY "Temp full access" ON public.user_roles USING (true);

-- 2. Ensure admin and customer users have the correct roles

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
WHERE email LIKE '%customer%' AND email NOT LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

-- 3. Fix the products table policy that has the same issue
DROP POLICY IF EXISTS "Allow admin full access" ON public.products;

-- 4. Create fixed policies

-- Create a simpler policy that allows users to view their own role
CREATE POLICY "Users can view their own role" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = id);

-- Create a policy that allows users with role='admin' to view all roles
CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
  );

-- Create a policy that allows users with role='admin' to insert/update/delete roles
CREATE POLICY "Admins can manage roles" 
  ON public.user_roles FOR ALL 
  USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
  );

-- Create a fixed policy for admin access to products
CREATE POLICY "Allow admin full access" 
  ON public.products FOR ALL 
  USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
  );

-- Drop the temporary policy
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;

-- 5. Verify the user_roles table has entries
SELECT * FROM public.user_roles; 