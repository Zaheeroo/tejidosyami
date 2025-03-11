#!/usr/bin/env ts-node

/**
 * This script runs the Tilopay payment tests and analyzes the results
 * to identify any issues with the payment integration.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}=== Tilopay Payment Integration Test ====${colors.reset}`);
console.log(`${colors.cyan}This script will test the Tilopay payment integration and identify any issues.${colors.reset}`);
console.log('');

// Check if dependencies are installed
const checkDependency = (packageName: string) => {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    return (
      (packageJson.dependencies && packageJson.dependencies[packageName]) ||
      (packageJson.devDependencies && packageJson.devDependencies[packageName])
    );
  } catch (e) {
    return false;
  }
};

const installDependencies = async () => {
  const missingDeps: string[] = [];
  
  if (!checkDependency('msw')) missingDeps.push('msw');
  if (!checkDependency('ts-jest')) missingDeps.push('ts-jest');
  if (!checkDependency('@types/jest')) missingDeps.push('@types/jest');
  if (!checkDependency('jest')) missingDeps.push('jest');
  
  if (missingDeps.length === 0) {
    console.log(`${colors.green}✓ All dependencies are installed${colors.reset}`);
    return true;
  }
  
  console.log(`${colors.yellow}Installing missing dependencies: ${missingDeps.join(', ')}${colors.reset}`);
  
  return new Promise<boolean>((resolve) => {
    const npmInstall = spawn('npm', ['install', '--save-dev', ...missingDeps], { stdio: 'inherit' });
    
    npmInstall.on('close', (code) => {
      if (code !== 0) {
        console.error(`${colors.red}Failed to install dependencies. Please install them manually with: npm install --save-dev ${missingDeps.join(' ')}${colors.reset}`);
        resolve(false);
      } else {
        console.log(`${colors.green}✓ Dependencies installed successfully${colors.reset}`);
        resolve(true);
      }
    });
  });
};

const runTests = () => {
  console.log(`${colors.cyan}Running Tilopay payment tests...${colors.reset}`);
  
  // Run the tests
  const jest = spawn('npx', ['jest', 'src/tests/tilopay-payment.test.ts', '--verbose'], { stdio: 'pipe' });
  
  let output = '';
  
  jest.stdout.on('data', (data) => {
    const chunk = data.toString();
    output += chunk;
    process.stdout.write(chunk);
  });
  
  jest.stderr.on('data', (data) => {
    const chunk = data.toString();
    output += chunk;
    process.stderr.write(chunk);
  });
  
  jest.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}Tests failed with exit code ${code}${colors.reset}`);
      analyzeTestResults(output, false);
    } else {
      console.log(`${colors.green}Tests passed!${colors.reset}`);
      analyzeTestResults(output, true);
    }
  });
};

const analyzeTestResults = (output: string, passed: boolean) => {
  console.log(`${colors.cyan}=== Analysis of Tilopay Integration ===${colors.reset}`);
  
  if (passed) {
    console.log(`${colors.green}✓ The mock tests passed successfully${colors.reset}`);
    console.log('');
    console.log(`${colors.yellow}However, you mentioned that you don't see transactions in the Tilopay dashboard.${colors.reset}`);
    console.log('Here are some potential issues to check:');
    console.log('');
    
    // Check API credentials
    console.log(`${colors.magenta}1. API Credentials${colors.reset}`);
    console.log('   Make sure your API credentials are correctly set in the .env file:');
    console.log('   - TILOPAY_API_USER should be: 8c0rWR');
    console.log('   - TILOPAY_API_PASSWORD should be: 1BNHKY');
    console.log('   - NEXT_PUBLIC_TILOPAY_PUBLIC_KEY should be: 8757-3297-5230-6396-6220');
    console.log('');
    
    // Check API endpoints
    console.log(`${colors.magenta}2. API Endpoints${colors.reset}`);
    console.log('   Verify that you\'re using the correct API endpoints:');
    console.log('   - TILOPAY_API_URL should be: https://tilopay.com/api/v1');
    console.log('');
    
    // Check implementation
    console.log(`${colors.magenta}3. Implementation Issues${colors.reset}`);
    console.log('   - Make sure you\'re not using test mode in production');
    console.log('   - Verify that the payment process is actually calling the Tilopay API');
    console.log('   - Check that you\'re properly handling the response from Tilopay');
    console.log('');
    
    // Check for network issues
    console.log(`${colors.magenta}4. Network Issues${colors.reset}`);
    console.log('   - Check for CORS issues in the browser console');
    console.log('   - Verify that your server can reach the Tilopay API');
    console.log('');
    
    // Recommend real API test
    console.log(`${colors.magenta}5. Test with Real API${colors.reset}`);
    console.log('   These tests used mocks. To test with the real Tilopay API:');
    console.log('   - Run the real API test with: npm run test:tilopay:real');
    console.log('');
    
  } else {
    console.log(`${colors.red}✗ The tests failed${colors.reset}`);
    
    // Check for common errors in the output
    if (output.includes('ECONNREFUSED')) {
      console.log(`${colors.red}Error: Connection refused${colors.reset}`);
      console.log('This suggests that the Tilopay API is not reachable. Check your internet connection and API URL.');
    }
    
    if (output.includes('401')) {
      console.log(`${colors.red}Error: Authentication failed (401)${colors.reset}`);
      console.log('This suggests that your API credentials are incorrect. Check your API user and password.');
    }
    
    if (output.includes('404')) {
      console.log(`${colors.red}Error: Endpoint not found (404)${colors.reset}`);
      console.log('This suggests that you\'re using an incorrect API endpoint. Check your API URL.');
    }
    
    console.log('');
    console.log('Please fix the issues and run the tests again.');
  }
  
  console.log('');
  console.log(`${colors.cyan}=== Next Steps ===${colors.reset}`);
  console.log('1. Fix any identified issues');
  console.log('2. Run the tests again with: npm run test:tilopay');
  console.log('3. If tests pass but you still don\'t see transactions, contact Tilopay support');
};

// Main function
const main = async () => {
  const depsInstalled = await installDependencies();
  if (depsInstalled) {
    runTests();
  }
};

// Run the main function
main().catch(console.error); 