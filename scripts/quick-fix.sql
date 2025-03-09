-- QUICK FIX SCRIPT
-- Run this in the Supabase SQL Editor to fix the user_roles table and RLS issues

-- 1. Disable RLS on user_roles table
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all policies on user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read access" ON public.user_roles;

-- 3. Make sure the user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert admin and customer users
INSERT INTO public.user_roles (id, role)
SELECT id, 'admin' as role
FROM auth.users
WHERE email LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO public.user_roles (id, role)
SELECT id, 'customer' as role
FROM auth.users
WHERE email NOT LIKE '%admin%'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

-- 5. Show the current user roles
SELECT * FROM public.user_roles; 