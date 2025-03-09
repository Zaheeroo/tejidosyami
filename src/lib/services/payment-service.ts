import axios from 'axios';

// Define Onvopay API types
export interface OnvopayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  redirectUrl: string;
  callbackUrl: string;
  testMode?: boolean;
  testCardNumber?: string;
}

export interface OnvopayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

export interface OnvopayWebhookPayload {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending';
  transactionId?: string;
  customerEmail: string;
  timestamp: string;
  signature: string;
}

// Onvopay API configuration
const ONVOPAY_API_URL = process.env.NEXT_PUBLIC_ONVOPAY_API_URL || 'https://api.onvopay.com';
const ONVOPAY_API_KEY = process.env.NEXT_PUBLIC_ONVOPAY_API_KEY || '';
const ONVOPAY_SECRET_KEY = process.env.ONVOPAY_SECRET_KEY || '';

// Flag to use mock implementation for testing
const USE_MOCK = true;

// Test card scenarios
const TEST_CARD_SCENARIOS = {
  '4242424242424242': { status: 'completed', message: 'Payment successful' },
  '4111111111111111': { status: 'failed', message: 'Insufficient funds' },
  '5555555555554444': { status: 'failed', message: 'Try again later' },
  '5454545454545454': { status: 'failed', message: 'Stolen card' },
  '378282246310005': { status: 'failed', message: 'Authentication failed' },
  '6011111111111117': { status: 'failed', message: 'Expired card' },
  '3566111111111113': { status: 'failed', message: 'Invalid card number' },
};

// Create a payment request with Onvopay
export async function createPayment(paymentData: OnvopayPaymentRequest): Promise<OnvopayPaymentResponse> {
  try {
    console.log('Creating payment with Onvopay:', paymentData);
    
    // Use mock implementation for testing
    if (USE_MOCK) {
      console.log('Using mock implementation for testing');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock payment ID
      const mockPaymentId = 'mock_' + Math.random().toString(36).substring(2, 15);
      
      // Handle test card scenarios if in test mode
      if (paymentData.testMode && paymentData.testCardNumber) {
        const cleanCardNumber = paymentData.testCardNumber.replace(/\s/g, '');
        const scenario = TEST_CARD_SCENARIOS[cleanCardNumber as keyof typeof TEST_CARD_SCENARIOS];
        
        // Create a mock payment URL that includes test card info
        const mockPaymentUrl = `${paymentData.redirectUrl}&mockPayment=true&paymentId=${mockPaymentId}&testCard=${cleanCardNumber}`;
        
        console.log(`Test payment with card ${cleanCardNumber}, scenario:`, scenario);
        
        return {
          success: true,
          paymentUrl: mockPaymentUrl,
          paymentId: mockPaymentId
        };
      }
      
      // Create a mock payment URL that redirects to the success page
      const mockPaymentUrl = `${paymentData.redirectUrl}&mockPayment=true&paymentId=${mockPaymentId}`;
      
      return {
        success: true,
        paymentUrl: mockPaymentUrl,
        paymentId: mockPaymentId
      };
    }
    
    // Real implementation
    console.log('Using API URL:', ONVOPAY_API_URL);
    console.log('Using API Key:', ONVOPAY_API_KEY.substring(0, 10) + '...');
    
    const response = await axios.post(
      `${ONVOPAY_API_URL}/payments/create`,
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ONVOPAY_API_KEY}`
        }
      }
    );

    console.log('Onvopay response:', response.data);

    if (response.data && response.data.success) {
      return {
        success: true,
        paymentUrl: response.data.paymentUrl,
        paymentId: response.data.paymentId
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Payment creation failed'
      };
    }
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment creation failed'
    };
  }
}

// Verify Onvopay webhook signature
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  // For mock implementation, always return true
  if (USE_MOCK) {
    console.log('Using mock implementation for webhook verification');
    return true;
  }
  
  // Real implementation
  console.log('Verifying webhook signature:', signature);
  
  // Note: Implement the actual signature verification logic based on Onvopay's documentation
  // This is a placeholder implementation
  
  // In a real implementation, you would:
  // 1. Create a string from the payload
  // 2. Generate a signature using the secret key
  // 3. Compare with the provided signature
  
  // For testing purposes, return true
  return true;
}

// Get payment status from Onvopay
export async function getPaymentStatus(paymentId: string, testCardNumber?: string): Promise<any> {
  try {
    console.log('Getting payment status for:', paymentId);
    
    // Use mock implementation for testing
    if (USE_MOCK) {
      console.log('Using mock implementation for payment status');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If test card number is provided, return the corresponding scenario
      if (testCardNumber) {
        const cleanCardNumber = testCardNumber.replace(/\s/g, '');
        const scenario = TEST_CARD_SCENARIOS[cleanCardNumber as keyof typeof TEST_CARD_SCENARIOS];
        
        if (scenario) {
          return {
            paymentId,
            status: scenario.status,
            message: scenario.message,
            amount: 100,
            currency: 'USD',
            transactionId: 'mock_tx_' + Math.random().toString(36).substring(2, 10)
          };
        }
      }
      
      // Return mock payment status (default success)
      return {
        paymentId,
        status: 'completed',
        amount: 100,
        currency: 'USD',
        transactionId: 'mock_tx_' + Math.random().toString(36).substring(2, 10)
      };
    }
    
    // Real implementation
    const response = await axios.get(
      `${ONVOPAY_API_URL}/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${ONVOPAY_API_KEY}`
        }
      }
    );
    
    console.log('Payment status response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error getting payment status:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to get payment status');
  }
} 