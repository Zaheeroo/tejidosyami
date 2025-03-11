import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './mock-server'; // Import the mock server

// Test card data from the notepad
const TEST_CARDS = {
  success: '4012000000020071',
  authDenied: '4012000000020121',
  insufficientFunds: '4112613451591116',
  invalidCvv: '4523080346468525',
  lostOrStolen: '4549179990476733'
};

// Tilopay API credentials from the notepad
const TILOPAY_API_KEY = '8757-3297-5230-6396-6220';
const TILOPAY_API_USER = '8c0rWR';
const TILOPAY_API_PASSWORD = '1BNHKY';
const TILOPAY_API_URL = 'https://tilopay.com/api/v1';

describe('Tilopay Payment Process', () => {
  // Test data
  const orderId = `test-order-${uuidv4()}`;
  const amount = 10.99;
  const customerEmail = 'test@example.com';
  const customerName = 'Test User';
  const description = `Test payment for order ${orderId}`;
  
  // Mock card data
  const cardData = {
    number: TEST_CARDS.success,
    exp_month: '12',
    exp_year: '2030',
    cvc: '123',
    name: customerName
  };

  test('should create a payment token and process payment', async () => {
    // Step 1: Create a payment token
    console.log('Step 1: Creating payment token with card:', cardData.number);
    
    try {
      // Direct API call to Tilopay to create token (will be intercepted by mock server)
      const tokenResponse = await axios.post(
        'https://tilopay.com/api/v1/tokens',
        {
          card: cardData
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDp0ZXN0' // This will be ignored by the mock server
          }
        }
      );
      
      console.log('Token response:', tokenResponse.data);
      expect(tokenResponse.data).toHaveProperty('id');
      
      const token = tokenResponse.data.id;
      
      // Step 2: Process payment with the token
      console.log('Step 2: Processing payment with token');
      
      const chargeResponse = await axios.post(
        'https://tilopay.com/api/v1/charges',
        {
          amount: amount * 100, // Convert to cents
          currency: 'USD',
          source: token,
          description: description,
          metadata: {
            order_id: orderId,
            customer_email: customerEmail
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDp0ZXN0' // This will be ignored by the mock server
          }
        }
      );
      
      console.log('Charge response:', chargeResponse.data);
      expect(chargeResponse.data).toHaveProperty('id');
      expect(chargeResponse.data.status).toBe('succeeded');
      
      // Step 3: Verify the transaction
      console.log('Step 3: Verifying transaction');
      
      const transactionId = chargeResponse.data.id;
      
      const transactionResponse = await axios.get(
        `https://tilopay.com/api/v1/charges/${transactionId}`,
        {
          headers: {
            'Authorization': 'Basic dGVzdDp0ZXN0' // This will be ignored by the mock server
          }
        }
      );
      
      console.log('Transaction verification response:', transactionResponse.data);
      expect(transactionResponse.data).toHaveProperty('id', transactionId);
      expect(transactionResponse.data.status).toBe('succeeded');
      
    } catch (error: any) {
      console.error('Error in payment process:', error.response?.data || error.message);
      throw error;
    }
  });

  test('should handle payment with insufficient funds', async () => {
    // Use a card that will trigger insufficient funds error
    const insufficientFundsCard = {
      ...cardData,
      number: TEST_CARDS.insufficientFunds
    };
    
    console.log('Testing payment with insufficient funds card:', insufficientFundsCard.number);
    
    try {
      // Create token with insufficient funds card
      const tokenResponse = await axios.post(
        'https://tilopay.com/api/v1/tokens',
        {
          card: insufficientFundsCard
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDp0ZXN0' // This will be ignored by the mock server
          }
        }
      );
      
      const token = tokenResponse.data.id;
      
      // Process payment with the token
      await axios.post(
        'https://tilopay.com/api/v1/charges',
        {
          amount: amount * 100,
          currency: 'USD',
          source: token,
          description: `Test payment with insufficient funds for order ${orderId}`,
          metadata: {
            order_id: orderId,
            customer_email: customerEmail
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic dGVzdDp0ZXN0' // This will be ignored by the mock server
          }
        }
      );
      
      // If we get here, the test should fail because we expect an error
      fail('Payment with insufficient funds should have failed');
    } catch (error: any) {
      console.log('Expected error response:', error.response?.data);
      expect(error.response?.data).toBeDefined();
      // Our mock server returns a 400 status with an error message
      expect(error.response?.data.error).toBeDefined();
    }
  });

  // Test our application's payment endpoint
  test('should process payment through our application API', async () => {
    console.log('Testing payment through our application API');
    
    try {
      // Create a test order
      const testOrderId = `test-order-${uuidv4()}`;
      
      // Call our application's payment process API
      const response = await axios.post(
        'http://localhost:3000/api/payments/process',
        {
          orderId: testOrderId,
          paymentToken: 'test_token', // This will be mocked in the API
          amount: amount,
          currency: 'USD',
          customerEmail: customerEmail,
          customerName: customerName,
          description: `Test payment through API for order ${testOrderId}`,
          provider: 'tilopay',
          testMode: true,
          testCardNumber: TEST_CARDS.success
        }
      );
      
      console.log('Application API response:', response.data);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('paymentStatus', 'paid');
      expect(response.data).toHaveProperty('transactionId');
      
    } catch (error: any) {
      console.error('Error calling application API:', error.response?.data || error.message);
      throw error;
    }
  });
  
  // Test our application's payment endpoint with a failing card
  test('should handle failed payment through our application API', async () => {
    console.log('Testing failed payment through our application API');
    
    try {
      // Create a test order
      const testOrderId = `test-order-${uuidv4()}`;
      
      // Call our application's payment process API with a failing card
      await axios.post(
        'http://localhost:3000/api/payments/process',
        {
          orderId: testOrderId,
          paymentToken: 'test_token',
          amount: amount,
          currency: 'USD',
          customerEmail: customerEmail,
          customerName: customerName,
          description: `Test failed payment through API for order ${testOrderId}`,
          provider: 'tilopay',
          testMode: true,
          testCardNumber: TEST_CARDS.insufficientFunds
        }
      );
      
      // If we get here, the test should fail because we expect an error
      fail('Payment with insufficient funds should have failed');
    } catch (error: any) {
      console.log('Expected error response from application API:', error.response?.data);
      expect(error.response?.data).toBeDefined();
      expect(error.response?.status).toBe(400);
      expect(error.response?.data.success).toBe(false);
      expect(error.response?.data.error).toBeDefined();
    }
  });
}); 