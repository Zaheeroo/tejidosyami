# Next.js E-commerce Template with Tilopay Integration

A modern e-commerce template built with Next.js 14, featuring Tilopay payment integration for secure payment processing.

## Features

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Tilopay Payment Integration
- Supabase Database
- Environment Variable Configuration
- Test Payment Page

## Getting Started

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your configuration:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Tilopay API Configuration
NEXT_PUBLIC_TILOPAY_PUBLIC_KEY=your_tilopay_public_key
NEXT_PUBLIC_TILOPAY_SDK_URL=https://tilopay.com/js/v2
TILOPAY_SECRET_KEY=your_tilopay_secret_key
TILOPAY_API_URL=https://app.tilopay.com/api/v1
TILOPAY_API_USER=your_tilopay_api_user
TILOPAY_API_PASSWORD=your_tilopay_api_password
```

4. Run the development server:
```bash
npm run dev
```

5. For testing payments, run:
```bash
npm run test:tilopay:full
```

## Testing Payments

The template includes a test page for Tilopay payment integration. Access it at:
```
http://localhost:3001/test-page.html
```

### Test Cards
- Success: 4012000000020071
- Auth Denied: 4012000000020121
- Insufficient Funds: 4112613451591116
- Invalid CVV: 4523080346468525
- Lost or Stolen: 4549179990476733

3DS Password for testing: 3ds2

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── payments/
│   │       ├── create/
│   │       └── process/
│   │       
│   ├── components/
│   └── lib/
├── scripts/
└── public/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.