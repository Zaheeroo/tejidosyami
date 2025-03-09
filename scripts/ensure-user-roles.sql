-- This script ensures that all users in auth.users have corresponding entries in user_roles

-- First, make sure the user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporarily disable RLS to allow this operation
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Insert admin users (those with 'admin' in their email)
INSERT INTO public.user_roles (id, role)
SELECT id, 'admin' as role
FROM auth.users
WHERE email LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Insert customer users (those without 'admin' in their email)
INSERT INTO public.user_roles (id, role)
SELECT id, 'customer' as role
FROM auth.users
WHERE email NOT LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple policies for the user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
  );

-- Show the current user roles
SELECT * FROM public.user_roles; 