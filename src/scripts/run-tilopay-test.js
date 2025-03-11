const { spawn } = require('child_process');
const path = require('path');

// Start the Next.js dev server
console.log('Starting Next.js dev server...');
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait for Next.js to start (this is a simple delay, not foolproof)
setTimeout(() => {
  console.log('Starting Tilopay test server...');
  // Start the Tilopay test server
  const testProcess = spawn('node', [path.join(__dirname, 'serve-tilopay-test.js')], {
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    nextProcess.kill('SIGINT');
    testProcess.kill('SIGINT');
    process.exit(0);
  });

  testProcess.on('close', (code) => {
    console.log(`Tilopay test server exited with code ${code}`);
    nextProcess.kill('SIGINT');
    process.exit(code);
  });
}, 5000); // Wait 5 seconds for Next.js to start

nextProcess.on('close', (code) => {
  console.log(`Next.js dev server exited with code ${code}`);
  process.exit(code);
}); 