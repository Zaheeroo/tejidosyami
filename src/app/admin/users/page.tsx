'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase-client'

interface User {
  id: string
  email: string
  role: string
  created_at: string
}

export default function UsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If user is not loading and either not logged in or not an admin, redirect to home
    if (!loading && (!user || !isAdmin(user))) {
      toast.error('You do not have permission to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !isAdmin(user)) return

      try {
        setIsLoading(true)
        
        // Simple approach: Just get the user roles
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
        
        if (error) throw error
        
        // Format the data with placeholder emails
        const formattedUsers = data.map(role => ({
          id: role.id,
          // In a real app, you would get the email from auth.users
          // For now, we'll use a placeholder based on the role
          email: role.role === 'admin' ? 'admin@example.com' : 'customer@example.com',
          role: role.role,
          created_at: role.created_at
        }))
        
        setUsers(formattedUsers)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
        
        // If we can't get the users, show a placeholder
        if (user) {
          setUsers([
            {
              id: user.id,
              email: user.email || 'admin@example.com',
              role: 'admin',
              created_at: new Date().toISOString()
            }
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin(user)) {
      fetchUsers()
    }
  }, [user])

  // Don't render anything while checking authentication
  if (loading || !user || !isAdmin(user)) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 mt-2">View and manage user accounts</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No users found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Note: User management functionality is limited in this demo. 
                  In a production environment, you would be able to add, edit, and remove users.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
} 