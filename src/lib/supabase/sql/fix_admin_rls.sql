-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;
DROP POLICY IF EXISTS "Service role can view all orders" ON orders;

-- Policy for users to view their own orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own orders
CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own orders
CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for admins to view all orders
-- This uses a more flexible approach to detect admins
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    auth.jwt() ->> 'email' LIKE '%admin%'
  );

-- Policy for admins to insert orders
CREATE POLICY "Admins can insert orders"
  ON orders
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    auth.jwt() ->> 'email' LIKE '%admin%'
  );

-- Policy for admins to update orders
CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    auth.jwt() ->> 'email' LIKE '%admin%'
  );

-- Policy for service role to manage all orders
CREATE POLICY "Service role can manage all orders"
  ON orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Also add a specific policy for service role to view all orders
CREATE POLICY "Service role can view all orders"
  ON orders
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'supabase_admin');

-- Drop existing policies for order_items if they exist
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can insert order items" ON order_items;
DROP POLICY IF EXISTS "Service role can view all order items" ON order_items;

-- Policy for users to view their own order items
CREATE POLICY "Users can view their own order items"
  ON order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- Policy for users to insert their own order items
CREATE POLICY "Users can insert their own order items"
  ON order_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- Policy for admins to view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    auth.jwt() ->> 'email' LIKE '%admin%'
  );

-- Policy for admins to insert order items
CREATE POLICY "Admins can insert order items"
  ON order_items
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' OR
    auth.jwt() ->> 'email' LIKE '%admin%'
  );

-- Add a policy for service role to view all order items
CREATE POLICY "Service role can view all order items"
  ON order_items
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'supabase_admin');

-- Make sure RLS is enabled on both tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY; 