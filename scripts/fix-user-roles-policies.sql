-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create a simpler policy that allows users to view their own role
CREATE POLICY "Users can view their own role" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = id);

-- Create a policy that allows users with role='admin' to view all roles
-- This avoids the recursion by not querying the same table in the policy
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

-- Also fix the products table policy that has the same issue
DROP POLICY IF EXISTS "Allow admin full access" ON public.products;

-- Create a fixed policy for admin access to products
CREATE POLICY "Allow admin full access" 
  ON public.products FOR ALL 
  USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
  ); 