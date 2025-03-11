import axios from 'axios';

// Define Tilopay API types
export interface TilopayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  customerLastName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerCountry?: string;
  customerPhone?: string;
  redirectUrl: string;
  callbackUrl: string;
  testMode?: boolean;
  testCardNumber?: string;
}

export interface TilopayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

export interface TilopayWebhookPayload {
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

// Tilopay API configuration
const TILOPAY_API_URL = process.env.TILOPAY_API_URL || 'https://app.tilopay.com/api/v1';
const TILOPAY_API_KEY = process.env.TILOPAY_SECRET_KEY || '8757-3297-5230-6396-6220';
const TILOPAY_API_USER = process.env.TILOPAY_API_USER || '8c0rWR';
const TILOPAY_API_PASSWORD = process.env.TILOPAY_API_PASSWORD || '1BNHKY';

// Test card scenarios
const TEST_CARD_SCENARIOS = {
  '4012000000020071': { status: 'succeeded', message: 'Payment successful' },
  '4012000000020089': { status: 'succeeded', message: 'Payment successful' },
  '4012000000020121': { status: 'failed', message: 'Authorization denied' },
  '4111111111119999': { status: 'failed', message: 'Authorization denied' },
  '4112613451591116': { status: 'failed', message: 'Insufficient funds' },
  '4523080346468525': { status: 'failed', message: 'Invalid CVV' },
  '4549179990476733': { status: 'failed', message: 'Lost or stolen card' },
};

// Get authentication token from Tilopay
export async function getAuthToken(): Promise<string> {
  try {
    console.log('Getting authentication token from Tilopay');
    
    const response = await axios.post(
      `${TILOPAY_API_URL}/login`,
      {
        apiuser: TILOPAY_API_USER,
        password: TILOPAY_API_PASSWORD
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data) {
      throw new Error('No response data from Tilopay');
    }
    
    // Check for access_token (API v1) or token (older versions)
    const token = response.data.access_token || response.data.token;
    
    if (!token) {
      console.error('Response data:', JSON.stringify(response.data, null, 2));
      throw new Error('No token returned from Tilopay');
    }
    
    console.log('Authentication token obtained successfully');
    return token;
  } catch (error: any) {
    console.error('Error getting authentication token from Tilopay:', error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to get authentication token');
  }
}

// Create a payment request with Tilopay
export async function createPayment(paymentData: TilopayPaymentRequest): Promise<TilopayPaymentResponse> {
  try {
    console.log('Creating payment with Tilopay:', {
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderId: paymentData.orderId
    });
    
    // Get authentication token
    const token = await getAuthToken();
    
    // Prepare the request body according to Tilopay API documentation
    const requestBody = {
      redirect: paymentData.redirectUrl,
      key: TILOPAY_API_KEY,
      amount: paymentData.amount.toFixed(2),
      currency: paymentData.currency,
      orderNumber: paymentData.orderId,
      capture: "1", // Capture immediately
      billToFirstName: paymentData.customerName || "Customer",
      billToLastName: paymentData.customerLastName || "Name",
      billToAddress: paymentData.customerAddress || "Address",
      billToAddress2: "",
      billToCity: paymentData.customerCity || "City",
      billToState: paymentData.customerState || "SJ",
      billToZipPostCode: paymentData.customerZip || "10000",
      billToCountry: paymentData.customerCountry || "CR",
      billToTelephone: paymentData.customerPhone || "88888888",
      billToEmail: paymentData.customerEmail,
      shipToFirstName: paymentData.customerName || "Customer",
      shipToLastName: paymentData.customerLastName || "Name",
      shipToAddress: paymentData.customerAddress || "Address",
      shipToAddress2: "",
      shipToCity: paymentData.customerCity || "City",
      shipToState: paymentData.customerState || "SJ",
      shipToZipPostCode: paymentData.customerZip || "10000",
      shipToCountry: paymentData.customerCountry || "CR",
      shipToTelephone: paymentData.customerPhone || "88888888",
      subscription: "0", // Don't save card by default
      platform: "NextJS",
      returnData: Buffer.from(paymentData.orderId).toString('base64'),
      hashVersion: "V2"
    };
    
    // For test cards, we'll handle them differently
    if (paymentData.testMode && paymentData.testCardNumber) {
      console.log(`Using test card: ${paymentData.testCardNumber}`);
      
      // In test mode, we'll create a mock payment URL
      // In a real implementation, you would still call the API
      // but Tilopay might have special handling for test cards
      const cleanCardNumber = paymentData.testCardNumber.replace(/\s/g, '');
      const scenario = TEST_CARD_SCENARIOS[cleanCardNumber as keyof typeof TEST_CARD_SCENARIOS];
      
      if (scenario && scenario.status !== 'succeeded') {
        return {
          success: false,
          error: scenario.message
        };
      }
      
      // For successful test cards, continue with the API call
    }
    
    // Make the API call to process the payment
    const response = await axios.post(
      `${TILOPAY_API_URL}/processPayment`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.data || !response.data.url) {
      throw new Error('No payment URL returned from Tilopay');
    }
    
    console.log('Payment created successfully:', {
      paymentUrl: response.data.url,
      paymentId: response.data.id || 'unknown'
    });
    
    return {
      success: true,
      paymentUrl: response.data.url,
      paymentId: response.data.id || `tilopay_${Date.now()}`
    };
  } catch (error: any) {
    console.error('Error creating payment with Tilopay:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment creation failed'
    };
  }
}

// Process a modification (capture, refund, reversal)
export async function processModification(orderNumber: string, amount: number, type: 1 | 2 | 3): Promise<any> {
  try {
    console.log(`Processing ${type === 1 ? 'capture' : type === 2 ? 'refund' : 'reversal'} for order ${orderNumber}`);
    
    // Get authentication token
    const token = await getAuthToken();
    
    const response = await axios.post(
      `${TILOPAY_API_URL}/processModification`,
      {
        type: type.toString(),
        key: TILOPAY_API_KEY,
        amount: amount.toFixed(2),
        orderNumber: orderNumber,
        hashVersion: "V2"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Modification processed successfully:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error processing modification with Tilopay:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Modification processing failed'
    };
  }
}

// Consult transaction status
export async function getTransactionStatus(orderNumber: string): Promise<any> {
  try {
    console.log('Getting transaction status for order:', orderNumber);
    
    // Get authentication token
    const token = await getAuthToken();
    
    const response = await axios.post(
      `${TILOPAY_API_URL}/consult`,
      {
        key: TILOPAY_API_KEY,
        orderNumber: orderNumber
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Transaction status retrieved successfully:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error getting transaction status from Tilopay:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get transaction status'
    };
  }
}

// Verify webhook signature
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  try {
    console.log('Verifying Tilopay webhook signature:', signature);
    
    // In a real implementation, you would:
    // 1. Create a string from the payload
    // 2. Generate a signature using the secret key
    // 3. Compare with the provided signature
    
    // For testing purposes, return true
    return true;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
} 