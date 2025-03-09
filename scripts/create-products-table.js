const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key. Make sure they are defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProductsTable() {
  console.log('Creating products table in Supabase...');

  try {
    // Create products table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url TEXT,
          stock INTEGER NOT NULL DEFAULT 0,
          category TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Allow public read access" ON public.products;
        CREATE POLICY "Allow public read access" 
          ON public.products FOR SELECT 
          USING (true);
          
        DROP POLICY IF EXISTS "Allow admin full access" ON public.products;
        CREATE POLICY "Allow admin full access" 
          ON public.products FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_roles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    });

    if (createTableError) {
      if (createTableError.message.includes('function exec_sql() does not exist')) {
        console.log('Creating exec_sql function first...');
        
        const { error: createFunctionError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
            END;
            $$;
          `
        });
        
        if (createFunctionError) {
          console.log('Could not create exec_sql function. Creating products table directly...');
          
          // Try direct SQL execution through the REST API
          const { error: directError } = await supabase
            .from('products')
            .select('*')
            .limit(1);
            
          if (directError && directError.code === '42P01') { // Table doesn't exist
            console.log('Creating products table directly...');
            // We'll need to use the Supabase dashboard to create the table
            console.log('Please create the products table manually in the Supabase dashboard.');
            console.log('Table structure:');
            console.log(`
              id: uuid (primary key, default: gen_random_uuid())
              name: text (required)
              description: text
              price: decimal(10,2) (required)
              image_url: text
              stock: integer (required, default: 0)
              category: text
              created_at: timestamptz (default: now())
              updated_at: timestamptz (default: now())
            `);
          } else {
            console.log('Products table already exists.');
          }
        } else {
          // Try again with the function created
          const { error: retryError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS public.products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image_url TEXT,
                stock INTEGER NOT NULL DEFAULT 0,
                category TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              -- Enable RLS
              ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
              
              -- Create policies
              DROP POLICY IF EXISTS "Allow public read access" ON public.products;
              CREATE POLICY "Allow public read access" 
                ON public.products FOR SELECT 
                USING (true);
                
              DROP POLICY IF EXISTS "Allow admin full access" ON public.products;
              CREATE POLICY "Allow admin full access" 
                ON public.products FOR ALL 
                USING (
                  EXISTS (
                    SELECT 1 FROM public.user_roles 
                    WHERE id = auth.uid() AND role = 'admin'
                  )
                );
            `
          });
          
          if (retryError) {
            console.error('Error creating products table:', retryError);
          } else {
            console.log('Products table created successfully!');
          }
        }
      } else {
        console.error('Error creating products table:', createTableError);
      }
    } else {
      console.log('Products table created successfully!');
    }

    // Insert sample products
    console.log('Inserting sample products...');
    
    const sampleProducts = [
      {
        name: 'Classic T-Shirt',
        description: 'A comfortable cotton t-shirt for everyday wear.',
        price: 19.99,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHNoaXJ0fGVufDB8fDB8fHww',
        stock: 100,
        category: 'Clothing'
      },
      {
        name: 'Denim Jeans',
        description: 'Classic blue denim jeans with a straight fit.',
        price: 49.99,
        image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amVhbnN8ZW58MHx8MHx8fDA%3D',
        stock: 50,
        category: 'Clothing'
      },
      {
        name: 'Leather Wallet',
        description: 'Genuine leather wallet with multiple card slots.',
        price: 29.99,
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2FsbGV0fGVufDB8fDB8fHww',
        stock: 30,
        category: 'Accessories'
      },
      {
        name: 'Wireless Headphones',
        description: 'Bluetooth headphones with noise cancellation.',
        price: 99.99,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D',
        stock: 20,
        category: 'Electronics'
      },
      {
        name: 'Smartwatch',
        description: 'Fitness tracker and smartwatch with heart rate monitoring.',
        price: 149.99,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D',
        stock: 15,
        category: 'Electronics'
      },
      {
        name: 'Backpack',
        description: 'Durable backpack with laptop compartment.',
        price: 59.99,
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmFja3BhY2t8ZW58MHx8MHx8fDA%3D',
        stock: 25,
        category: 'Accessories'
      }
    ];
    
    for (const product of sampleProducts) {
      const { error: insertError } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'name' });
        
      if (insertError) {
        console.error(`Error inserting product ${product.name}:`, insertError);
      } else {
        console.log(`Product ${product.name} inserted successfully!`);
      }
    }
    
    console.log('Products table setup completed!');
    
  } catch (error) {
    console.error('Error setting up products table:', error);
  }
}

createProductsTable(); 