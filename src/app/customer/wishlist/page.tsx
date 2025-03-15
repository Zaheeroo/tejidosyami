'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, Heart, Trash2, ShoppingCart, Sparkles } from 'lucide-react'
import { WishlistItem, getWishlist, removeFromWishlist } from '@/lib/services/wishlist-service'
import { useCart } from '@/lib/contexts/CartContext'

export default function CustomerWishlistPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { addToCart } = useCart()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If user is not loading and either not logged in or not a customer, redirect to home
    if (!loading && (!user || !isCustomer(user))) {
      toast.error('You need to be logged in as a customer to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadWishlist() {
      if (user && isCustomer(user)) {
        try {
          setIsLoading(true)
          const items = await getWishlist(user.id)
          setWishlistItems(items)
        } catch (error) {
          console.error('Error loading wishlist:', error)
          toast.error('Failed to load wishlist')
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (user && !loading) {
      loadWishlist()
    }
  }, [user, loading])

  // Function to remove item from wishlist
  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) return

    try {
      await removeFromWishlist(user.id, productId)
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId))
      toast.success('Item removed from wishlist')
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove item from wishlist')
    }
  }

  // Function to add item to cart
  const handleAddToCart = (item: WishlistItem) => {
    if (!item.product) return
    
    addToCart(item.product, 1)
    toast.success('Item added to cart')
  }

  // Don't render anything while checking authentication
  if (loading || !user || !isCustomer(user)) {
    return null
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Wishlist</h1>
                <p className="text-gray-600">Items you've saved for future crochet joy</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link href="/products">
                  <Button className="bg-rose-500 hover:bg-rose-600">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Discover More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Wishlist Summary */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-rose-50 to-amber-50 mb-8 overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">Saved Items</CardTitle>
              </div>
              <CardDescription>
                Your collection of favorite crochet items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-rose-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-rose-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
                    <Heart className="h-10 w-10 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-gray-800">Your Wishlist is Empty</h3>
                  <p className="text-gray-600 text-center max-w-md mb-8">
                    You haven't added any products to your wishlist yet. 
                    Browse our handcrafted crochet items and click the heart icon to save your favorites.
                  </p>
                  <Link href="/products">
                    <Button className="bg-rose-500 hover:bg-rose-600">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((item) => (
                    <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white overflow-hidden flex flex-col h-full">
                      <div className="relative aspect-square overflow-hidden">
                        {item.product?.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover transition-transform hover:scale-105 duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Heart className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        <button 
                          onClick={() => handleRemoveFromWishlist(item.product_id)}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </button>
                      </div>
                      <CardContent className="flex-grow p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{item.product?.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.product?.description}</p>
                        <p className="text-lg font-bold text-gray-800">${item.product?.price.toFixed(2)}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          className="w-full bg-rose-500 hover:bg-rose-600"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Wishlist Tips */}
          {wishlistItems.length > 0 && (
            <Card className="border-0 shadow-md bg-white mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Wishlist Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-rose-500 text-xs">1</span>
                    </div>
                    <p className="text-gray-700 text-sm">Items in your wishlist will be saved for future visits</p>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-500 text-xs">2</span>
                    </div>
                    <p className="text-gray-700 text-sm">You'll be notified if items in your wishlist go on sale</p>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-500 text-xs">3</span>
                    </div>
                    <p className="text-gray-700 text-sm">Share your wishlist with friends and family for gift ideas</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
} 