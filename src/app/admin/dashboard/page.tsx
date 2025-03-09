'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, Package, ShoppingBag, Plus, AlertTriangle, BarChart } from 'lucide-react'
import { getDashboardStats, DashboardStats } from '@/lib/services/dashboard-service'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If user is not loading and either not logged in or not an admin, redirect to home
    if (!loading && (!user || !isAdmin(user))) {
      toast.error('You do not have permission to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || !isAdmin(user)) return

      try {
        setIsLoading(true)
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin(user)) {
      fetchDashboardStats()
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.productCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Manage your product inventory
                  </p>
                  <Link href="/admin/products" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      View Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Manage user accounts
                  </p>
                  <Link href="/admin/users" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      View Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.orderCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    View and manage customer orders
                  </p>
                  <Link href="/admin/orders" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      View Orders
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Products</CardTitle>
                  <CardDescription>Latest products added to your inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.recentProducts && stats.recentProducts.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentProducts.map((product) => (
                        <div key={product.id} className="flex items-center space-x-4">
                          <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">${product.price.toFixed(2)} • {product.stock} in stock</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No products found</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href="/admin/products" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Products
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Low Stock Products</CardTitle>
                  <CardDescription>Products that need to be restocked soon</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                    <div className="space-y-4">
                      {stats.lowStockProducts.map((product) => (
                        <div key={product.id} className="flex items-center space-x-4">
                          <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{product.name}</p>
                            <div className="flex items-center">
                              <p className="text-xs text-red-500 font-medium">Only {product.stock} left in stock</p>
                              {product.stock < 5 && (
                                <AlertTriangle className="h-3 w-3 text-red-500 ml-1" />
                              )}
                            </div>
                          </div>
                          <Link href={`/admin/products/edit/${product.id}`}>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No low stock products</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href="/admin/products" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Inventory
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4">Product Categories</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Category Distribution
                  </CardTitle>
                  <CardDescription>Number of products by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.productsByCategory && stats.productsByCategory.length > 0 ? (
                    <div className="space-y-4">
                      {stats.productsByCategory.map((item) => (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{item.category}</span>
                            <span className="text-sm text-gray-500">{item.count} products</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${(item.count / stats.productCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No categories found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  )
} 