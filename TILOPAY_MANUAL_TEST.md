# Tilopay Manual Test

This document provides instructions on how to manually test the Tilopay payment integration.

## Prerequisites

- Node.js installed
- npm installed
- A Tilopay account with API credentials

## Setup

1. Make sure your `.env.local` file contains the correct Tilopay API credentials:

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

## Running the Test

There are two ways to run the manual test:

### Option 1: Run Both Servers at Once (Recommended)

This option starts both the Next.js development server and the test server in a single command:

```bash
npm run test:tilopay:full
```

This will:
1. Start the Next.js development server on port 3000
2. Start the test server on port 3001
3. Automatically open your browser to the test page

### Option 2: Run Servers Separately

If you prefer to run the servers separately:

1. Start the Next.js development server:

```bash
npm run dev
```

2. In a separate terminal, start the test server:

```bash
npm run test:tilopay:manual
```

## Using the Test Page

1. The test page will open in your browser at http://localhost:3001
2. Fill in the payment details or use the default values
3. Select a test card from the dropdown
4. Click "Create Payment"
5. When the payment is created successfully, click the payment URL to complete the payment process
6. On the Tilopay payment page, enter the test card details:
   - Card Number: Use the selected test card number
   - Expiry Date: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
   - If prompted for 3DS authentication, use the password: `3ds2`
7. Complete the payment process
8. Check your Tilopay dashboard to see the transaction

## Test Cards

The following test cards can be used:

| Card Type | Card Number | Expected Result |
|-----------|-------------|-----------------|
| Visa (Success) | 4012000000020071 | Payment succeeds |
| Visa (Auth Denied) | 4012000000020121 | Authorization denied |
| Visa (Insufficient Funds) | 4112613451591116 | Insufficient funds |
| Visa (Invalid CVV) | 4523080346468525 | Invalid CVV |
| Visa (Lost or Stolen) | 4549179990476733 | Card reported lost or stolen |

## Troubleshooting

If you encounter issues:

1. Make sure your Next.js development server is running on port 3000
2. Check that your Tilopay API credentials are correct in the `.env.local` file
3. Verify that the test server is running on port 3001
4. Check the browser console and server logs for any errors
5. Ensure you're using a test card from the list above

## After Testing

After completing your tests, you can stop the servers by pressing `Ctrl+C` in the terminal where they're running. 