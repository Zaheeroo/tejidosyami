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
import { ShoppingBag, Package, User, Heart, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { getProducts, Product } from '@/lib/services/product-service'
import { getUserOrders } from '@/lib/services/order-service'
import { getWishlistCount } from '@/lib/services/wishlist-service'
import ProductCard from '@/components/ProductCard'

export default function CustomerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [orderCount, setOrderCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
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

        // Fetch wishlist count
        const wishlistTotal = await getWishlistCount(user.id)
        setWishlistCount(wishlistTotal)

        // Log to verify
        console.log('Order count:', ordersData.length, 'distinct orders')
        console.log('Total items across all orders:', ordersData.reduce((total, order) => 
          total + (order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0))
        
        // Log each order with its items
        ordersData.forEach((order, index) => {
          console.log(`Order ${index + 1} (ID: ${order.id}):`, 
            order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0, 'items')
        })
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
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="relative mb-10 rounded-xl bg-gradient-to-r from-rose-100 to-teal-100 p-8 shadow-md overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF9D9D" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-1.5C87,13.3,81.3,26.6,73.6,39.1C65.9,51.6,56.1,63.2,43.7,70.7C31.3,78.1,15.7,81.4,0.4,80.8C-14.9,80.1,-29.9,75.5,-43.4,68.1C-56.9,60.7,-69,50.4,-76.2,37.4C-83.5,24.4,-86,8.7,-83.9,-5.8C-81.8,-20.2,-75.1,-33.3,-65.7,-43.9C-56.3,-54.5,-44.1,-62.5,-31.6,-70.4C-19.1,-78.2,-6.4,-85.9,6.9,-87.1C20.2,-88.3,40.5,-83,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2 text-gray-800">Welcome, {user.email?.split('@')[0]}!</h1>
              <p className="text-gray-600 mb-4">Explore your handcrafted crochet journey</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button className="bg-rose-500 hover:bg-rose-600">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Explore Products
                  </Button>
                </Link>
                <Link href="/customer/profile">
                  <Button variant="outline" className="border-rose-200 text-gray-700 hover:bg-rose-100">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">My Orders</CardTitle>
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">{orderCount}</div>
                <p className="text-sm text-gray-500 mb-4">
                  Total orders placed
                </p>
                <Link href="/customer/orders" className="inline-block">
                  <Button variant="outline" size="sm" className="border-rose-200 text-gray-700 hover:bg-rose-100">
                    View Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">Wishlist</CardTitle>
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-teal-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">{wishlistCount}</div>
                <p className="text-sm text-gray-500 mb-4">
                  Items saved for later
                </p>
                <Link href="/customer/wishlist" className="inline-block">
                  <Button variant="outline" size="sm" className="border-teal-200 text-gray-700 hover:bg-teal-100">
                    View Wishlist
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">Recent Activity</CardTitle>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">{recentProducts.length}</div>
                <p className="text-sm text-gray-500 mb-4">
                  New products to explore
                </p>
                <Link href="/products" className="inline-block">
                  <Button variant="outline" size="sm" className="border-amber-200 text-gray-700 hover:bg-amber-100">
                    Browse All
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Products Section */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Recent Products</h2>
                <p className="text-gray-500 text-sm">Handcrafted with love, just for you</p>
              </div>
              <Link href="/products">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-100">
                  View All
                </Button>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-rose-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-rose-500 rounded-full animate-spin"></div>
                </div>
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="text-center py-16 border rounded-xl bg-white shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No products available yet</p>
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-100">
                  Check Back Soon
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recentProducts.map(product => (
                  <div key={product.id} className="transform transition-transform hover:scale-105">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Crochet Tips Section */}
          <div className="mb-10">
            <Card className="border-0 shadow-md bg-gradient-to-r from-teal-50 to-rose-50 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">Crochet Care Tips</CardTitle>
                <CardDescription>Keep your handcrafted items looking beautiful</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-rose-500 text-xs">1</span>
                    </div>
                    <p className="text-gray-700 text-sm">Hand wash your crochet items with mild soap in lukewarm water</p>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-500 text-xs">2</span>
                    </div>
                    <p className="text-gray-700 text-sm">Lay flat to dry to maintain shape and prevent stretching</p>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-500 text-xs">3</span>
                    </div>
                    <p className="text-gray-700 text-sm">Store in a cool, dry place away from direct sunlight</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
} 