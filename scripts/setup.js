const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Supabase setup...');

// Run the SQL functions script first
console.log('\n1. Creating SQL functions...');
const sqlFunctionsScript = spawn('node', [path.join(__dirname, 'create-sql-functions.js')]);

sqlFunctionsScript.stdout.on('data', (data) => {
  console.log(data.toString());
});

sqlFunctionsScript.stderr.on('data', (data) => {
  console.error(data.toString());
});

sqlFunctionsScript.on('close', (code) => {
  if (code !== 0) {
    console.error(`SQL functions script exited with code ${code}`);
  }
  
  // Then run the Supabase setup script
  console.log('\n2. Setting up Supabase...');
  const setupScript = spawn('node', [path.join(__dirname, 'setup-supabase.js')]);
  
  setupScript.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  setupScript.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  setupScript.on('close', (code) => {
    if (code !== 0) {
      console.error(`Supabase setup script exited with code ${code}`);
      process.exit(code);
    }
    
    console.log('\nSetup completed!');
    console.log('\nYou can now run the application with:');
    console.log('npm run dev');
    console.log('\nAnd log in with:');
    console.log('Admin: admin@example.com / password123');
    console.log('Customer: customer@example.com / password123');
  });
}); 