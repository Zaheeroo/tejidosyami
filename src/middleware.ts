import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  ],
} 