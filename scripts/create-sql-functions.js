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

async function createSQLFunctions() {
  console.log('Creating SQL functions in Supabase...');

  try {
    // Create function to create user_roles table
    console.log('Creating create_user_roles_table function...');
    
    const createTableFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_user_roles_table()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.user_roles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
        DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
        
        -- Create policies
        CREATE POLICY "Users can view their own role" 
          ON public.user_roles FOR SELECT 
          USING (auth.uid() = id);
          
        CREATE POLICY "Admins can view all roles" 
          ON public.user_roles FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_roles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      END;
      $$;
    `;
    
    // Create function to execute arbitrary SQL (for table creation)
    console.log('Creating create_user_roles_table_sql function...');
    
    const executeSQLFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_user_roles_table_sql(sql_command TEXT)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_command;
      END;
      $$;
    `;
    
    // Execute the SQL to create the functions
    const { error: createTableFunctionError } = await supabase.rpc(
      'exec_sql', 
      { sql: createTableFunctionSQL }
    ).single();
    
    if (createTableFunctionError) {
      // If the exec_sql function doesn't exist, create it first
      if (createTableFunctionError.message.includes('function exec_sql() does not exist')) {
        console.log('Creating exec_sql function first...');
        
        const execSQLFunctionSQL = `
          CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `;
        
        // Execute raw SQL to create the exec_sql function
        const { error: execSQLError } = await supabase.rpc(
          'exec_sql', 
          { sql: execSQLFunctionSQL }
        ).single();
        
        if (execSQLError) {
          console.log('Could not create exec_sql function. Trying direct SQL execution...');
          
          // Try to execute the SQL directly
          const { error: directError } = await supabase.from('_exec_sql').select('*');
          
          if (directError) {
            console.error('Error creating SQL functions:', directError);
            return;
          }
        }
        
        // Try again to create the table function
        const { error: retryError } = await supabase.rpc(
          'exec_sql', 
          { sql: createTableFunctionSQL }
        ).single();
        
        if (retryError) {
          console.error('Error creating create_user_roles_table function:', retryError);
          return;
        }
      } else {
        console.error('Error creating create_user_roles_table function:', createTableFunctionError);
        return;
      }
    }
    
    // Create the execute SQL function
    const { error: executeSQLFunctionError } = await supabase.rpc(
      'exec_sql', 
      { sql: executeSQLFunctionSQL }
    ).single();
    
    if (executeSQLFunctionError) {
      console.error('Error creating create_user_roles_table_sql function:', executeSQLFunctionError);
      return;
    }
    
    console.log('SQL functions created successfully!');
    
  } catch (error) {
    console.error('Error creating SQL functions:', error);
  }
}

createSQLFunctions(); 