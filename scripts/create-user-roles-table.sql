-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own role
CREATE POLICY "Users can view their own role" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = id);
  
-- Admins can view all roles
CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert admin and customer roles for existing users
-- Note: Replace these UUIDs with the actual user IDs from your auth.users table
-- You can find these by running: SELECT id, email FROM auth.users;
INSERT INTO public.user_roles (id, role)
SELECT id, 
  CASE 
    WHEN email LIKE '%admin%' THEN 'admin'
    ELSE 'customer'
  END as role
FROM auth.users
ON CONFLICT (id) DO NOTHING; 