'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5">
      <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
        <Link href="/" className="flex items-center">
          <span className="self-center text-xl font-semibold whitespace-nowrap">
            My App
          </span>
        </Link>
        
        <div className="flex items-center lg:order-2">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button
                variant="outline"
                onClick={handleSignOut}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 