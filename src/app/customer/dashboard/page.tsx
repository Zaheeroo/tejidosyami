'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShoppingBag, Package, User, Heart } from 'lucide-react'
import { getProducts, Product } from '@/lib/services/product-service'
import { getUserOrders } from '@/lib/services/order-service'
import ProductCard from '@/components/ProductCard'

export default function CustomerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [orderCount, setOrderCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If user is not loading and either not logged in or not a customer, redirect to home
    if (!loading && (!user || !isCustomer(user))) {
      toast.error('You need to be logged in as a customer to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true)
        
        // Fetch products
        const productsData = await getProducts()
        // Get the 4 most recent products
        setRecentProducts(productsData.slice(0, 4))
        
        // Fetch user orders
        const ordersData = await getUserOrders(user.id)
        setOrderCount(ordersData.length)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && !loading) {
      fetchData()
    }
  }, [user, loading])

  // Don't render anything while checking authentication
  if (loading || !user || !isCustomer(user)) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Welcome, {user.email?.split('@')[0]}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderCount}</div>
              <p className="text-xs text-muted-foreground">
                View your order history
              </p>
              <Link href="/customer/orders" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  View Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Products you've saved for later
              </p>
              <Link href="/customer/wishlist" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  View Wishlist
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm truncate">{user.email}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your account details
              </p>
              <Link href="/customer/profile" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Browse Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Explore our product catalog
              </p>
              <Link href="/products" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  Shop Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Products</h2>
            <Link href="/products">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <p className="text-gray-500">No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
} 