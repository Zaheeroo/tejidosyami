import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupWishlistTable() {
  try {
    // Create wishlist table
    const { error: tableError } = await supabase.rpc('create_wishlist_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS wishlists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          product_id UUID NOT NULL REFERENCES products(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, product_id)
        );

        -- Enable RLS
        ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DO $$ 
        BEGIN
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Users can view their own wishlist items" ON wishlists;
          DROP POLICY IF EXISTS "Users can add items to their wishlist" ON wishlists;
          DROP POLICY IF EXISTS "Users can remove items from their wishlist" ON wishlists;

          -- Create new policies
          CREATE POLICY "Users can view their own wishlist items"
            ON wishlists
            FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can add items to their wishlist"
            ON wishlists
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can remove items from their wishlist"
            ON wishlists
            FOR DELETE
            USING (auth.uid() = user_id);
        END $$;

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
        CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
      `
    })

    if (tableError) {
      console.error('Error creating wishlist table:', tableError)
      return
    }

    console.log('Wishlist table and policies created successfully')
  } catch (error) {
    console.error('Error setting up wishlist:', error)
  }
}

setupWishlistTable() 