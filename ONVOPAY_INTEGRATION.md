# Onvopay Payment Gateway Integration

This document provides instructions for setting up and using the Onvopay payment gateway integration in your Next.js e-commerce application.

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```
ONVOPAY_API_URL=https://api.onvopay.com
ONVOPAY_API_KEY=your_test_api_key_here
ONVOPAY_SECRET_KEY=your_test_secret_key_here
```

Replace the placeholder values with your actual Onvopay API credentials.

### 2. Database Setup

Run the SQL script in `src/lib/supabase/sql/orders_setup.sql` in your Supabase SQL editor to create the necessary tables and policies for orders and payments.

### 3. Install Dependencies

Make sure you have the required dependencies installed:

```bash
npm install axios uuid @types/uuid
```

## Integration Components

The integration consists of the following components:

### API Routes

- `/api/payments/create` - Creates a new payment request with Onvopay
- `/api/payments/webhook` - Handles webhook callbacks from Onvopay
- `/api/payments/status/[paymentId]` - Retrieves the status of a payment

### React Components

- `PaymentForm` - A form component for initiating payments
- `CheckoutPage` - A page that creates an order and displays the payment form
- `PaymentSuccessPage` - A page that displays a success message after payment

## Usage

### Creating a Payment

1. Add products to the cart
2. Navigate to the checkout page
3. The system will create an order in the database
4. The payment form will be displayed
5. Click "Pay Now" to initiate the payment
6. You will be redirected to the Onvopay payment page
7. Complete the payment
8. You will be redirected back to the success page

### Handling Webhooks

Onvopay will send webhook notifications to your webhook endpoint (`/api/payments/webhook`) when payment status changes. The webhook handler will:

1. Verify the webhook signature
2. Update the order status in the database
3. Trigger any additional actions (e.g., sending confirmation emails)

## Testing

To test the integration:

1. Use Onvopay's test credentials
2. Make test payments using Onvopay's test cards
3. Verify that orders are created and updated correctly
4. Check that webhook notifications are processed correctly

## Troubleshooting

If you encounter issues:

1. Check the browser console and server logs for errors
2. Verify that your Onvopay API credentials are correct
3. Ensure that your webhook URL is accessible from the internet
4. Check that the database tables and policies are set up correctly

## Production Deployment

Before deploying to production:

1. Replace test API credentials with production credentials
2. Ensure that your webhook URL is using HTTPS
3. Set up proper error handling and monitoring
4. Test the entire payment flow thoroughly 