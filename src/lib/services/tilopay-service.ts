import axios from 'axios';

// Tilopay API URLs
const TILOPAY_API_URL = 'https://app.tilopay.com/api/v1';

// Tilopay API credentials
const TILOPAY_API_USER = '8c0rWR';
const TILOPAY_API_PASSWORD = '1BNHKY';
const TILOPAY_API_KEY = '8757-3297-5230-6396-6220';

// Tilopay API types
export interface TilopayOrderRequest {
  amount: string;
  currency: string;
  orderNumber: string;
  description?: string;
  customerEmail: string;
  customerName?: string;
  customerLastName?: string;
  redirectUrl: string;
}

export interface TilopayOrderResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

export interface TilopayTransactionResponse {
  success: boolean;
  status?: string;
  transactionId?: string;
  error?: string;
}

interface TilopayAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Get Tilopay access token
async function getAccessToken(): Promise<{ token: string; tokenType: string }> {
  try {
    console.log('Getting Tilopay access token...');
    
    const response = await axios.post<TilopayAuthResponse>(
      `${TILOPAY_API_URL}/login`,
      {
        apiuser: TILOPAY_API_USER,
        password: TILOPAY_API_PASSWORD
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Tilopay login response:', response.data);
    
    if (!response.data.access_token) {
      throw new Error('No access_token received from Tilopay API');
    }
    
    return {
      token: response.data.access_token,
      tokenType: response.data.token_type
    };
  } catch (error: any) {
    console.error('Error getting Tilopay access token:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get Tilopay access token');
  }
}

// Create a Tilopay payment URL
export async function createTilopayPayment(paymentData: TilopayOrderRequest): Promise<TilopayOrderResponse> {
  try {
    console.log('Tilopay service: Creating Tilopay payment for order:', paymentData.orderNumber);
    
    const auth = await getAccessToken();
    console.log('Got Tilopay access token:', auth.token);
    
    // Split the customer name into first and last name if not provided separately
    let firstName = paymentData.customerName || '';
    let lastName = paymentData.customerLastName || '';
    
    if (!lastName && firstName.includes(' ')) {
      const nameParts = firstName.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
    
    const payload = {
      redirect: paymentData.redirectUrl,
      key: TILOPAY_API_KEY,
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderNumber: paymentData.orderNumber,
      capture: "1",
      billToFirstName: firstName,
      billToLastName: lastName || "Customer",
      billToAddress: "Address Line 1", // These fields are required by Tilopay
      billToAddress2: "Address Line 2",
      billToCity: "City",
      billToState: "ST",
      billToZipPostCode: "10000",
      billToCountry: "US",
      billToTelephone: "1234567890",
      billToEmail: paymentData.customerEmail,
      shipToFirstName: firstName,
      shipToLastName: lastName || "Customer",
      shipToAddress: "Address Line 1",
      shipToAddress2: "Address Line 2",
      shipToCity: "City",
      shipToState: "ST",
      shipToZipPostCode: "10000",
      shipToCountry: "US",
      shipToTelephone: "1234567890",
      subscription: "0",
      platform: "website",
      returnData: Buffer.from(paymentData.orderNumber).toString('base64'),
      hashVersion: "V2"
    };
    
    console.log('Tilopay service: Sending request to Tilopay API with payload:', JSON.stringify(payload));
    
    const response = await axios.post(
      `${TILOPAY_API_URL}/processPayment`,
      payload,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `${auth.tokenType} ${auth.token}`
        }
      }
    );
    
    console.log('Tilopay service: Tilopay API response:', response.data);
    
    if (response.data.url) {
      return {
        success: true,
        paymentUrl: response.data.url
      };
    } else {
      return {
        success: false,
        error: 'No payment URL received from Tilopay'
      };
    }
  } catch (error: any) {
    console.error('Error creating Tilopay payment:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create Tilopay payment'
    };
  }
}

// Check Tilopay transaction status
export async function checkTilopayTransaction(orderNumber: string): Promise<TilopayTransactionResponse> {
  try {
    const auth = await getAccessToken();
    
    const response = await axios.post(
      `${TILOPAY_API_URL}/consult`,
      {
        key: TILOPAY_API_KEY,
        orderNumber: orderNumber
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `${auth.tokenType} ${auth.token}`
        }
      }
    );
    
    if (response.data && response.data.status) {
      return {
        success: true,
        status: response.data.status,
        transactionId: response.data.id || response.data.transactionId
      };
    } else {
      return {
        success: false,
        error: 'Invalid response from Tilopay'
      };
    }
  } catch (error: any) {
    console.error('Error checking Tilopay transaction:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to check Tilopay transaction'
    };
  }
} 