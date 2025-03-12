import axios from 'axios';

// PayPal API URLs
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// PayPal API types
export interface PayPalOrderRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

export interface PayPalCaptureResponse {
  success: boolean;
  captureId?: string;
  transactionId?: string;
  status?: string;
  error?: string;
}

// Get PayPal access token
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_API_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting PayPal access token:', error);
    throw new Error(error.response?.data?.error_description || 'Failed to get PayPal access token');
  }
}

// Create a PayPal order
export async function createPayPalOrder(paymentData: PayPalOrderRequest): Promise<PayPalOrderResponse> {
  try {
    const accessToken = await getAccessToken();
    
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: paymentData.orderId,
          description: paymentData.description || `Payment for order ${paymentData.orderId}`,
          amount: {
            currency_code: paymentData.currency,
            value: paymentData.amount.toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: 'Tejidos Yami',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: paymentData.returnUrl,
        cancel_url: paymentData.cancelUrl
      }
    };
    
    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return {
      success: true,
      orderId: response.data.id
    };
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create PayPal order'
    };
  }
}

// Capture a PayPal payment
export async function capturePayPalPayment(orderId: string): Promise<PayPalCaptureResponse> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const captureId = response.data.purchase_units[0]?.payments?.captures[0]?.id;
    const transactionId = captureId;
    const status = response.data.status;
    
    return {
      success: true,
      captureId,
      transactionId,
      status: status.toLowerCase()
    };
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to capture PayPal payment'
    };
  }
}

// Get PayPal order details
export async function getPayPalOrderDetails(orderId: string): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return {
      success: true,
      orderDetails: response.data
    };
  } catch (error: any) {
    console.error('Error getting PayPal order details:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get PayPal order details'
    };
  }
} 