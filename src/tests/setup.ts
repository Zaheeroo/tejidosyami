// This file contains setup code that will be run before each test

// Increase timeout for all tests
jest.setTimeout(30000);

// Global beforeAll hook
beforeAll(() => {
  console.log('Starting Tilopay payment tests...');
  
  // Set environment variables for testing
  process.env.TILOPAY_API_URL = 'https://checkout.tilopay.com/api/v2';
  process.env.TILOPAY_API_USER = '8c0rWR';
  process.env.TILOPAY_API_PASSWORD = '1BNHKY';
  process.env.NEXT_PUBLIC_TILOPAY_PUBLIC_KEY = '8757-3297-5230-6396-6220';
});

// Global afterAll hook
afterAll(() => {
  console.log('Finished Tilopay payment tests');
}); 