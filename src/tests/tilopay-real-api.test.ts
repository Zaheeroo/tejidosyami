import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Test card data from the documentation
const TEST_CARDS = {
  success: '4012000000020071', // Valid test card for VTEX/WIX
  authDenied: '4012000000020121',
  insufficientFunds: '4112613451591116',
  invalidCvv: '4523080346468525',
  lostOrStolen: '4549179990476733'
};

// Tilopay API credentials from the notepad
const TILOPAY_API_KEY = process.env.NEXT_PUBLIC_TILOPAY_PUBLIC_KEY || '8757-3297-5230-6396-6220';
const TILOPAY_API_USER = process.env.TILOPAY_API_USER || '8c0rWR';
const TILOPAY_API_PASSWORD = process.env.TILOPAY_API_PASSWORD || '1BNHKY';
const TILOPAY_API_URL = process.env.TILOPAY_API_URL || 'https://checkout.tilopay.com/api/v2';

describe('Tilopay Real API Payment Process', () => {
  // Test data
  const orderId = `test-order-${uuidv4()}`;
  const amount = 10.99;
  const customerEmail = 'test@example.com';
  const customerName = 'Test User';
  const description = `Test payment for order ${orderId}`;
  
  // Test card data - using a valid test card
  const cardData = {
    number: TEST_CARDS.success,
    exp_month: '12',
    exp_year: '2030',
    cvc: '123',
    name: customerName
  };

  // This test uses the real Tilopay API
  test('should create a payment token and process payment with real API', async () => {
    // Step 1: Create a payment token
    console.log('Step 1: Creating payment token with card:', cardData.number);
    
    try {
      // Direct API call to Tilopay to create token
      const tokenResponse = await axios.post(
        `${TILOPAY_API_URL}/tokens`,
        {
          card: cardData,
          test_mode: true // Enable test mode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${TILOPAY_API_USER}:${TILOPAY_API_PASSWORD}`).toString('base64')}`,
            'X-Api-Key': TILOPAY_API_KEY
          }
        }
      );
      
      console.log('Token response:', tokenResponse.data);
      expect(tokenResponse.data).toHaveProperty('id');
      
      const token = tokenResponse.data.id;
      
      // Step 2: Process payment with the token
      console.log('Step 2: Processing payment with token');
      
      const chargeResponse = await axios.post(
        `${TILOPAY_API_URL}/charges`,
        {
          amount: amount * 100, // Convert to cents
          currency: 'USD',
          source: token,
          description: description,
          test_mode: true, // Enable test mode
          metadata: {
            order_id: orderId,
            customer_email: customerEmail
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${TILOPAY_API_USER}:${TILOPAY_API_PASSWORD}`).toString('base64')}`,
            'X-Api-Key': TILOPAY_API_KEY
          }
        }
      );
      
      console.log('Charge response:', chargeResponse.data);
      expect(chargeResponse.data).toHaveProperty('id');
      
      // Step 3: Verify the transaction
      console.log('Step 3: Verifying transaction');
      
      const transactionId = chargeResponse.data.id;
      
      const transactionResponse = await axios.get(
        `${TILOPAY_API_URL}/charges/${transactionId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TILOPAY_API_USER}:${TILOPAY_API_PASSWORD}`).toString('base64')}`,
            'X-Api-Key': TILOPAY_API_KEY
          }
        }
      );
      
      console.log('Transaction verification response:', transactionResponse.data);
      expect(transactionResponse.data).toHaveProperty('id', transactionId);
      
      // Log success message with transaction ID
      console.log(`Successfully created transaction with ID: ${transactionId}`);
      console.log('Check your Tilopay dashboard to see this transaction.');
      
    } catch (error: any) {
      console.error('Error in payment process:', error.response?.data || error.message);
      throw error;
    }
  }, 30000); // Increase timeout for this test
}); 