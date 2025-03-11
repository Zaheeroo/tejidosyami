// Import dependencies
const TilopayAPI = require('../lib/services/tilopay-api');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test card data from the documentation
const TEST_CARDS = {
  success: '4012000000020071', // Valid test card for VTEX/WIX
  authDenied: '4012000000020121',
  insufficientFunds: '4112613451591116',
  invalidCvv: '4523080346468525',
  lostOrStolen: '4549179990476733'
};

async function testTilopayIntegration() {
  console.log('=== Testing Tilopay Integration ===');
  console.log('API URL:', process.env.TILOPAY_API_URL);
  console.log('API Key:', process.env.TILOPAY_SECRET_KEY ? `${process.env.TILOPAY_SECRET_KEY.substring(0, 8)}...` : 'undefined');
  console.log('API User:', process.env.TILOPAY_API_USER);
  
  try {
    // Step 1: Get authentication token
    console.log('\n1. Testing authentication...');
    
    try {
      const token = await TilopayAPI.getAuthToken();
      console.log('Authentication successful! Token:', token.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
      console.log('\n=== Integration Test Failed ===');
      console.log('Failed to authenticate with Tilopay API. Check your API credentials.');
      return;
    }
    
    // Step 2: Create a payment
    console.log('\n2. Testing payment creation...');
    
    // Generate a unique order ID with timestamp to make it easier to identify in the dashboard
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const orderId = `test-order-${timestamp}`;
    
    const paymentRequest = {
      amount: 10.99,
      currency: 'USD',
      orderId: orderId,
      description: `Test payment for order ${orderId}`,
      customerEmail: 'test@example.com',
      customerName: 'Test',
      customerLastName: 'User',
      customerAddress: 'Test Address',
      customerCity: 'Test City',
      customerState: 'SJ',
      customerZip: '10000',
      customerCountry: 'CR',
      customerPhone: '88888888',
      redirectUrl: 'https://example.com/success',
      callbackUrl: 'https://example.com/webhook',
      testMode: true,
      testCardNumber: TEST_CARDS.success
    };
    
    const paymentResult = await TilopayAPI.createPayment(paymentRequest);
    
    if (paymentResult.success) {
      console.log('Payment creation successful!');
      console.log('Payment URL:', paymentResult.paymentUrl);
      console.log('Payment ID:', paymentResult.paymentId);
      console.log('Order ID:', orderId);
      console.log('\nIMPORTANT: To see this transaction in your dashboard, you may need to:');
      console.log('1. Complete the payment flow by visiting the payment URL');
      console.log('2. Check the "Test Transactions" section if available');
      console.log('3. Wait a few minutes for the transaction to appear');
      
      // Step 3: Check transaction status
      console.log('\n3. Testing transaction status check...');
      
      try {
        const statusResult = await TilopayAPI.getTransactionStatus(orderId);
        
        if (statusResult.success) {
          console.log('Transaction status check successful!');
          console.log('Status data:', statusResult.data);
          
          console.log('\n=== Integration Test Successful ===');
          console.log('Your Tilopay integration is working correctly!');
        } else {
          console.log('Transaction status check failed:', statusResult.error);
          console.log('\n=== Integration Test Partially Successful ===');
          console.log('Payment creation was successful, but transaction status check failed.');
        }
      } catch (error: any) {
        console.error('Transaction status check error:', error.message);
        console.log('\n=== Integration Test Partially Successful ===');
        console.log('Payment creation was successful, but transaction status check failed.');
      }
    } else {
      console.log('Payment creation failed:', paymentResult.error);
      console.log('\n=== Integration Test Failed ===');
      console.log('Failed to create a payment. Check your API credentials and payment parameters.');
    }
  } catch (error: any) {
    console.error('Error during integration test:', error.message);
    console.log('\n=== Integration Test Failed ===');
    console.log('An unexpected error occurred during the integration test.');
    console.log('Check your API credentials, network connectivity, and try again.');
  }
}

// Run the test
testTilopayIntegration(); 