'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ChevronLeft, User, Mail, ShoppingBag, Heart, Settings, Shield } from 'lucide-react'

export default function CustomerProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // If user is not loading and either not logged in or not a customer, redirect to home
    if (!loading && (!user || !isCustomer(user))) {
      toast.error('You need to be logged in as a customer to access this page')
      router.push('/')
    } else if (user) {
      setEmail(user.email || '')
      // In a real app, you would fetch the user's profile from the database
      setName(user.email?.split('@')[0] || '')
    }
  }, [user, loading, router])

  // Don't render anything while checking authentication
  if (loading || !user || !isCustomer(user)) {
    return null
  }

  const handleSave = () => {
    // In a real app, you would save the user's profile to the database
    toast.success('Profile updated successfully')
    setIsEditing(false)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link href="/customer/dashboard" className="flex items-center text-rose-600 hover:text-rose-700 mb-2 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <Card className="border-0 shadow-md bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-rose-100 to-teal-100 h-24"></div>
                <CardContent className="pt-0 -mt-12">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-rose-100 border-4 border-white shadow-md flex items-center justify-center mb-4">
                      <User className="h-12 w-12 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{email}</p>
                    <div className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-medium mt-2">
                      Crochet Enthusiast
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-4 flex justify-between">
                  <Link href="/customer/orders">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-rose-600 hover:bg-rose-50">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Orders
                    </Button>
                  </Link>
                  <Link href="/customer/wishlist">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-rose-600 hover:bg-rose-50">
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              {/* Account Security */}
              <Card className="border-0 shadow-md bg-white mt-6 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-teal-500" />
                    <CardTitle className="text-lg font-medium text-gray-800">Account Security</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Email Verification</p>
                        <p className="text-xs text-gray-500">Your email has been verified</p>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Password</p>
                        <p className="text-xs text-gray-500">Last updated 30 days ago</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs border-teal-200 text-gray-700 hover:bg-teal-50">
                        Change
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Profile Information */}
            <div className="md:col-span-2">
              <Card className="border-0 shadow-md bg-white overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-amber-500" />
                      <CardTitle className="text-lg font-medium text-gray-800">Profile Information</CardTitle>
                    </div>
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-amber-200 text-gray-700 hover:bg-amber-50"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditing}
                          className={`pl-10 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="email"
                          value={email}
                          disabled
                          className="pl-10 bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    {isEditing && (
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className="border-gray-200 text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave}
                          className="bg-rose-500 hover:bg-rose-600"
                        >
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Preferences Card */}
              <Card className="border-0 shadow-md bg-white mt-6 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                    </svg>
                    <CardTitle className="text-lg font-medium text-gray-800">Preferences</CardTitle>
                  </div>
                  <CardDescription>Customize your shopping experience</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Email Notifications</p>
                        <p className="text-xs text-gray-500">Receive updates about your orders and promotions</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle" defaultChecked className="sr-only" />
                        <div className="block h-6 bg-gray-300 rounded-full w-12"></div>
                        <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition-transform duration-200 ease-in-out transform translate-x-6"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Newsletter</p>
                        <p className="text-xs text-gray-500">Stay updated with new crochet patterns and products</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle2" defaultChecked className="sr-only" />
                        <div className="block h-6 bg-gray-300 rounded-full w-12"></div>
                        <div className="absolute left-1 top-1 bg-white rounded-full h-4 w-4 transition-transform duration-200 ease-in-out transform translate-x-6"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Note: Preference management functionality is limited in this demo.
                    In a production environment, these settings would be fully functional.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
} 