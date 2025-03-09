'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsSubmitted(true)
      toast.success('Password reset email sent')
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? 'Check your email for a password reset link' 
              : 'Enter your email to receive a password reset link'}
          </CardDescription>
        </CardHeader>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm">
                Remember your password?{' '}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Back to login
                </Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <p className="text-center">
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your email and follow the instructions.
            </p>
            <Button 
              className="w-full mt-4" 
              onClick={() => setIsSubmitted(false)}
            >
              Send another email
            </Button>
            <p className="text-center text-sm mt-4">
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-800"
              >
                Back to login
              </Link>
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
} 