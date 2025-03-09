-- First, let's create a temporary policy to allow this script to work
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles;
CREATE POLICY "Temp full access" ON public.user_roles USING (true);

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
WHERE email LIKE '%customer%'
ON CONFLICT (id) DO UPDATE SET role = 'customer';

-- Drop the temporary policy
DROP POLICY IF EXISTS "Temp full access" ON public.user_roles; 