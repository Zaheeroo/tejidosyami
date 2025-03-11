import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

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

// Define types for request bodies
interface PaymentProcessRequest {
  orderId: string;
  testCardNumber?: string;
  testMode?: boolean;
  [key: string]: any;
}

interface TokenRequest {
  card: {
    number: string;
    exp_month: string;
    exp_year: string;
    cvc: string;
    name?: string;
  };
}

interface ChargeRequest {
  source: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

// Create mock handlers
const handlers = [
  // Mock our application's payment process API
  http.post('http://localhost:3000/api/payments/process', async ({ request }) => {
    const body = await request.json() as PaymentProcessRequest;
    const { orderId, testCardNumber, testMode } = body;
    
    console.log('Mock server received payment process request:', body);
    
    if (testMode && testCardNumber) {
      const scenario = TEST_CARD_SCENARIOS[testCardNumber as keyof typeof TEST_CARD_SCENARIOS];
      
      if (scenario) {
        if (scenario.status === 'succeeded') {
          return HttpResponse.json({
            success: true,
            paymentStatus: 'paid',
            message: scenario.message,
            transactionId: `mock_tx_${Date.now()}`
          });
        } else {
          return HttpResponse.json({
            success: false,
            error: scenario.message
          }, { status: 400 });
        }
      }
    }
    
    // Default success response
    return HttpResponse.json({
      success: true,
      paymentStatus: 'paid',
      message: 'Payment successful',
      transactionId: `mock_tx_${Date.now()}`
    });
  }),
  
  // Mock Tilopay token API
  http.post('https://tilopay.com/api/v1/tokens', async ({ request }) => {
    const body = await request.json() as TokenRequest;
    const { card } = body;
    
    console.log('Mock server received token request:', { cardNumber: card.number });
    
    const scenario = TEST_CARD_SCENARIOS[card.number as keyof typeof TEST_CARD_SCENARIOS];
    
    if (scenario && scenario.status === 'failed') {
      return HttpResponse.json({
        error: {
          type: 'card_error',
          message: scenario.message,
          code: 'card_declined'
        }
      }, { status: 400 });
    }
    
    // Success response
    return HttpResponse.json({
      id: `tok_${Date.now()}`,
      object: 'token',
      card: {
        id: `card_${Date.now()}`,
        object: 'card',
        last4: card.number.slice(-4),
        brand: 'visa',
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        name: card.name
      }
    });
  }),
  
  // Mock Tilopay charges API
  http.post('https://tilopay.com/api/v1/charges', async ({ request }) => {
    const body = await request.json() as ChargeRequest;
    const { source, amount, currency, description, metadata } = body;
    
    console.log('Mock server received charge request:', { 
      source, 
      amount, 
      currency, 
      description, 
      metadata 
    });
    
    // Success response
    const chargeId = `ch_${Date.now()}`;
    return HttpResponse.json({
      id: chargeId,
      object: 'charge',
      amount: amount,
      currency: currency,
      status: 'succeeded',
      description: description,
      metadata: metadata,
      created: Math.floor(Date.now() / 1000),
      source: source
    });
  }),
  
  // Mock Tilopay get charge API
  http.get('https://tilopay.com/api/v1/charges/:chargeId', ({ params }) => {
    const { chargeId } = params;
    
    console.log('Mock server received get charge request:', { chargeId });
    
    // Success response
    return HttpResponse.json({
      id: chargeId,
      object: 'charge',
      amount: 1099,
      currency: 'usd',
      status: 'succeeded',
      description: 'Test payment',
      created: Math.floor(Date.now() / 1000)
    });
  })
];

// Create the server
export const server = setupServer(...handlers);

// Start the server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close()); 