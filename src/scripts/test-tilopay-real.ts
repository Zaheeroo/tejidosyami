#!/usr/bin/env ts-node

/**
 * This script runs the Tilopay payment tests with the real API
 * to verify that the integration is working correctly.
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

console.log(`${colors.cyan}=== Tilopay Real API Payment Test ====${colors.reset}`);
console.log(`${colors.cyan}This script will test the Tilopay payment integration with the real API.${colors.reset}`);
console.log(`${colors.yellow}WARNING: This will create a real test transaction in your Tilopay account.${colors.reset}`);
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
  console.log(`${colors.cyan}Running Tilopay real API payment tests...${colors.reset}`);
  
  // Run the tests
  const jest = spawn('npx', ['jest', 'src/tests/tilopay-real-api.test.ts', '--verbose'], { stdio: 'pipe' });
  
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
    console.log(`${colors.green}✓ The real API tests passed successfully${colors.reset}`);
    console.log('');
    
    // Extract transaction ID from the output
    const transactionIdMatch = output.match(/Successfully created transaction with ID: ([a-zA-Z0-9_]+)/);
    if (transactionIdMatch && transactionIdMatch[1]) {
      const transactionId = transactionIdMatch[1];
      console.log(`${colors.green}Transaction ID: ${transactionId}${colors.reset}`);
      console.log('Check your Tilopay dashboard to see this transaction.');
    }
    
    console.log('');
    console.log(`${colors.magenta}Next Steps:${colors.reset}`);
    console.log('1. Verify that the transaction appears in your Tilopay dashboard');
    console.log('2. If it appears, your integration is working correctly');
    console.log('3. If it doesn\'t appear, there may be an issue with your Tilopay account or credentials');
    
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
    console.log(`${colors.magenta}Troubleshooting:${colors.reset}`);
    console.log('1. Check your API credentials in the .env file');
    console.log('2. Verify that the Tilopay API URL is correct');
    console.log('3. Make sure your account has API access enabled');
    console.log('4. Contact Tilopay support if you continue to have issues');
  }
  
  console.log('');
  console.log(`${colors.cyan}=== Next Steps ===${colors.reset}`);
  console.log('1. Fix any identified issues');
  console.log('2. Run the tests again with: npm run test:tilopay:real');
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