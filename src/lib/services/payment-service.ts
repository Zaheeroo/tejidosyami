import axios from 'axios';

// Define Tilopay API types
export interface TilopayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  customerLastName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerCountry?: string;
  customerPhone?: string;
  description?: string;
  redirectUrl?: string;
  callbackUrl?: string;
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
  status: string;
  amount: number;
  currency: string;
  transactionId?: string;
  paymentMethod?: string;
  errorMessage?: string;
}

// Tilopay API configuration
const TILOPAY_API_URL = process.env.TILOPAY_API_URL || 'https://app.tilopay.com/api/v1';
const TILOPAY_API_USER = process.env.TILOPAY_API_USER || '';
const TILOPAY_API_PASSWORD = process.env.TILOPAY_API_PASSWORD || '';

// Test card scenarios
const TEST_CARD_SCENARIOS: { [key: string]: { status: string; message: string } } = {
  '4012000000020071': { status: 'succeeded', message: 'Payment successful' },
  '4012000000020089': { status: 'succeeded', message: 'Payment successful' },
  '4012000000020121': { status: 'failed', message: 'Authorization denied' },
  '4111111111119999': { status: 'failed', message: 'Authorization denied' },
  '4112613451591116': { status: 'failed', message: 'Insufficient funds' },
  '4523080346468525': { status: 'failed', message: 'Invalid CVV' },
  '4549179990476733': { status: 'failed', message: 'Lost or stolen card' },
};

// Create a payment request with Tilopay
export async function createPayment(paymentData: TilopayPaymentRequest): Promise<TilopayPaymentResponse> {
  try {
    // For test mode, simulate payment response based on test card
    if (paymentData.testMode && paymentData.testCardNumber) {
      const cleanCardNumber = paymentData.testCardNumber.replace(/\s/g, '');
      const scenario = TEST_CARD_SCENARIOS[cleanCardNumber];
      
      if (scenario) {
        if (scenario.status === 'succeeded') {
          return {
            success: true,
            paymentUrl: `${paymentData.redirectUrl}?orderId=${paymentData.orderId}&status=success`,
            paymentId: `tilopay_${Date.now()}`
          };
        } else {
          return {
            success: false,
            error: scenario.message
          };
        }
      }
    }
    
    // Make the API call to process the payment
    const response = await axios.post(
      `${TILOPAY_API_URL}/processPayment`,
      {
        redirect: paymentData.redirectUrl,
        callback: paymentData.callbackUrl,
        amount: paymentData.amount.toFixed(2),
        currency: paymentData.currency,
        orderNumber: paymentData.orderId,
        description: paymentData.description,
        billToFirstName: paymentData.customerName || "Customer",
        billToLastName: paymentData.customerLastName || "Name",
        billToAddress: paymentData.customerAddress || "Address",
        billToCity: paymentData.customerCity || "City",
        billToState: paymentData.customerState || "SJ",
        billToZipPostCode: paymentData.customerZip || "10000",
        billToCountry: paymentData.customerCountry || "CR",
        billToTelephone: paymentData.customerPhone || "88888888",
        billToEmail: paymentData.customerEmail,
        shipToFirstName: paymentData.customerName || "Customer",
        shipToLastName: paymentData.customerLastName || "Name",
        shipToAddress: paymentData.customerAddress || "Address",
        shipToCity: paymentData.customerCity || "City",
        shipToState: paymentData.customerState || "SJ",
        shipToZipPostCode: paymentData.customerZip || "10000",
        shipToCountry: paymentData.customerCountry || "CR",
        shipToTelephone: paymentData.customerPhone || "88888888",
        returnData: Buffer.from(paymentData.orderId).toString('base64')
      },
      {
        auth: {
          username: TILOPAY_API_USER,
          password: TILOPAY_API_PASSWORD
        }
      }
    );
    
    if (!response.data?.url) {
      throw new Error('No payment URL returned from Tilopay');
    }
    
    return {
      success: true,
      paymentUrl: response.data.url,
      paymentId: response.data.id || `tilopay_${Date.now()}`
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Payment creation failed'
    };
  }
}

// Verify Tilopay webhook signature
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  if (!signature) {
    return false;
  }
  
  try {
    // TODO: Implement signature verification based on Tilopay's documentation
    // For now, return true in development
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Get payment status from Tilopay
export async function getPaymentStatus(paymentId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const response = await axios.get(
      `${TILOPAY_API_URL}/payments/${paymentId}`,
      {
        auth: {
          username: TILOPAY_API_USER,
          password: TILOPAY_API_PASSWORD
        }
      }
    );
    
    return {
      success: true,
      status: response.data.status
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get payment status'
    };
  }
} 