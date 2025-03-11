# Tilopay Integration

This document provides information about the Tilopay payment gateway integration in this project.

## Overview

Tilopay is a payment gateway that allows you to process payments securely. This integration supports:

- Creating payment requests
- Processing payments
- Checking transaction status
- Handling webhooks

## Configuration

The following environment variables are required for the Tilopay integration:

```
# Public variables (available to client-side code)
NEXT_PUBLIC_TILOPAY_PUBLIC_KEY=your-public-key
NEXT_PUBLIC_TILOPAY_SDK_URL=https://tilopay.com/js/v2

# Private variables (only available to server-side code)
TILOPAY_SECRET_KEY=your-secret-key
TILOPAY_API_URL=https://app.tilopay.com/api/v1
TILOPAY_API_USER=your-api-user
TILOPAY_API_PASSWORD=your-api-password
```

## API Implementation

The Tilopay API is implemented in `src/lib/services/tilopay-api.ts` and provides the following functions:

- `getAuthToken()`: Retrieves an authentication token from the Tilopay API
- `createPayment(paymentData)`: Creates a payment request and returns a payment URL
- `processModification(orderNumber, amount, type)`: Processes modifications such as captures, refunds, or reversals
- `getTransactionStatus(orderNumber)`: Retrieves the status of a transaction
- `verifyWebhookSignature(payload, signature)`: Verifies the signature of webhook payloads

## Integration with the Application

The Tilopay API is integrated with the application through the following components:

- `src/app/api/payments/create/route.ts`: API route for creating payment requests
- `src/app/api/payments/process/route.ts`: API route for processing payments
- `src/app/api/payments/webhook/route.ts`: API route for handling webhooks

## Testing

You can test the Tilopay integration using the following npm scripts:

- `npm run test:tilopay:integration`: Runs the integration test to verify the Tilopay API implementation

## Test Cards

The following test cards can be used for testing:

- Success: `4012000000020071`
- Authentication Denied: `4012000000020121`
- Insufficient Funds: `4112613451591116`
- Invalid CVV: `4523080346468525`
- Lost or Stolen: `4549179990476733`

## Troubleshooting

If you encounter issues with the Tilopay integration, check the following:

1. Verify that the environment variables are set correctly
2. Check the API credentials
3. Ensure that the API URL is correct
4. Check the network connectivity
5. Review the logs for error messages

## Resources

- [Tilopay Documentation](https://tilopay.com/docs)
- [Tilopay API Reference](https://tilopay.com/docs/api) 