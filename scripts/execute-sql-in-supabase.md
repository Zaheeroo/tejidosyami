# How to Execute SQL Scripts in Supabase

Follow these steps to create the necessary tables in your Supabase project:

## Step 1: Access the SQL Editor

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. In the left sidebar, click on "SQL Editor"
4. Click "New Query" to create a new SQL query

## Step 2: Create the User Roles Table

1. Open the file `scripts/create-user-roles-table.sql` in your code editor
2. Copy the entire contents of the file
3. Paste it into the SQL Editor in Supabase
4. Click "Run" to execute the query

This will:
- Create the `user_roles` table if it doesn't exist
- Set up Row Level Security policies
- Assign roles to existing users based on their email addresses

## Step 3: Create the Products Table

1. Open the file `scripts/create-products-table.sql` in your code editor
2. Copy the entire contents of the file
3. Paste it into the SQL Editor in Supabase
4. Click "Run" to execute the query

This will:
- Create the `products` table if it doesn't exist
- Set up Row Level Security policies
- Insert sample products into the table

## Step 4: Verify the Tables

After running both scripts, you can verify that the tables were created correctly:

1. In the left sidebar of Supabase, click on "Table Editor"
2. You should see both `products` and `user_roles` tables listed
3. Click on each table to view its contents and verify that the data was inserted correctly

## Step 5: Restart Your Application

Once the tables are created and populated, restart your application to see the changes take effect.

## Troubleshooting

If you encounter any errors:

1. Check the error message in the SQL Editor
2. Make sure you're running the scripts in the correct order (user_roles first, then products)
3. If you see a conflict with existing tables, you can modify the scripts to drop the tables first:
   ```sql
   DROP TABLE IF EXISTS public.products CASCADE;
   -- Then continue with the CREATE TABLE statement
   ``` 