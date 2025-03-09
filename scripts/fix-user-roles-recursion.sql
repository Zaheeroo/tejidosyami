-- This script fixes the infinite recursion issue by disabling RLS for the user_roles table
-- This is a temporary solution for development/testing purposes

-- First, drop all policies on the user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read access" ON public.user_roles;

-- Disable RLS on the user_roles table
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Make sure all users have roles
INSERT INTO public.user_roles (id, role)
SELECT id, 
  CASE 
    WHEN email LIKE '%admin%' THEN 'admin'
    ELSE 'customer'
  END as role
FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 
  CASE 
    WHEN auth.users.email LIKE '%admin%' THEN 'admin'
    ELSE 'customer'
  END;

-- Show the current user roles
SELECT * FROM public.user_roles; 