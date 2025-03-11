import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Define protected routes that require authentication
const protectedRoutes = [
  '/auth/update-password',
  '/admin/dashboard',
  '/customer/dashboard'
]

// Define auth routes that should redirect to home if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  
  // Handle protected routes
  const path = request.nextUrl.pathname
  
  // Check if the route is protected and user is not authenticated
  if (protectedRoutes.some(route => path.startsWith(route)) && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Check if the route is an auth route and user is already authenticated
  if (authRoutes.some(route => path === route) && session) {
    // Redirect to appropriate dashboard based on user role
    // Note: This is a simple check. In a real app, you would use Supabase's user metadata
    // or a separate table to determine user roles
    const userEmail = session.user?.email || ''
    
    if (userEmail.includes('admin')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/customer/dashboard', request.url))
    }
  }

  // Check if the request is for an API route
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Get the origin from the request headers or default to localhost:3001
    const origin = request.headers.get('origin') || 'http://localhost:3001';
    
    // Create a new response object
    const response = NextResponse.next();
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
    
    return response;
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Match all API routes
    '/api/:path*',
  ],
} 