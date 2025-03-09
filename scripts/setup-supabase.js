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

async function setupSupabase() {
  console.log('Setting up Supabase...');

  try {
    // 1. Enable email auth
    console.log('Enabling email auth...');
    // This is already enabled by default in Supabase

    // 2. Create admin user
    console.log('Creating admin user...');
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (adminError) {
      if (adminError.message.includes('already exists')) {
        console.log('Admin user already exists');
      } else {
        throw adminError;
      }
    } else {
      console.log('Admin user created:', adminData.user.email);
    }

    // 3. Create customer user
    console.log('Creating customer user...');
    const { data: customerData, error: customerError } = await supabase.auth.admin.createUser({
      email: 'customer@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'customer' }
    });

    if (customerError) {
      if (customerError.message.includes('already exists')) {
        console.log('Customer user already exists');
      } else {
        throw customerError;
      }
    } else {
      console.log('Customer user created:', customerData.user.email);
    }

    // 4. Create user_roles table
    console.log('Creating user_roles table...');
    const { error: createTableError } = await supabase.rpc('create_user_roles_table');
    
    if (createTableError) {
      if (createTableError.message.includes('already exists')) {
        console.log('user_roles table already exists');
      } else {
        console.log('Creating user_roles table using SQL...');
        // Try creating the table directly with SQL
        const { error: sqlError } = await supabase
          .from('user_roles')
          .select('*')
          .limit(1);
          
        if (sqlError && sqlError.code === '42P01') { // Table doesn't exist
          const { error: createError } = await supabase.rpc('create_user_roles_table_sql', {
            sql_command: `
              CREATE TABLE IF NOT EXISTS user_roles (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY "Users can view their own role" 
                ON user_roles FOR SELECT 
                USING (auth.uid() = id);
                
              CREATE POLICY "Admins can view all roles" 
                ON user_roles FOR SELECT 
                USING (
                  auth.uid() IN (
                    SELECT id FROM user_roles WHERE role = 'admin'
                  )
                );
            `
          });
          
          if (createError) {
            console.log('Error creating user_roles table with SQL:', createError);
          } else {
            console.log('user_roles table created with SQL');
          }
        } else {
          console.log('user_roles table already exists');
        }
      }
    } else {
      console.log('user_roles table created');
    }

    // 5. Insert roles for users
    console.log('Inserting roles for users...');
    
    // Get admin user
    const { data: adminUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'admin@example.com')
      .single();
      
    // Get customer user
    const { data: customerUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'customer@example.com')
      .single();
    
    if (adminUser) {
      const { error: adminRoleError } = await supabase
        .from('user_roles')
        .upsert({ id: adminUser.id, role: 'admin' });
        
      if (adminRoleError) {
        console.log('Error inserting admin role:', adminRoleError);
      } else {
        console.log('Admin role inserted');
      }
    }
    
    if (customerUser) {
      const { error: customerRoleError } = await supabase
        .from('user_roles')
        .upsert({ id: customerUser.id, role: 'customer' });
        
      if (customerRoleError) {
        console.log('Error inserting customer role:', customerRoleError);
      } else {
        console.log('Customer role inserted');
      }
    }

    console.log('Supabase setup completed successfully!');
    console.log('\nYou can now log in with:');
    console.log('Admin: admin@example.com / password123');
    console.log('Customer: customer@example.com / password123');
    
  } catch (error) {
    console.error('Error setting up Supabase:', error);
  }
}

setupSupabase(); 