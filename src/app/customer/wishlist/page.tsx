'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isCustomer } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronLeft, Heart, Trash2, ShoppingCart } from 'lucide-react'
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/customer/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-gray-500 mt-2">Products you've saved for later</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Saved Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Heart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Your Wishlist is Empty</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  You haven't added any products to your wishlist yet. 
                  Browse our products and click the heart icon to add items to your wishlist.
                </p>
                <Link href="/products">
                  <Button>
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <Card key={item.id} className="flex flex-col">
                    <div className="relative aspect-square">
                      {item.product?.image_url && (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      )}
                    </div>
                    <CardContent className="flex flex-col flex-grow p-4">
                      <h3 className="font-semibold mb-2">{item.product?.name}</h3>
                      <p className="text-lg font-bold mb-4">${item.product?.price.toFixed(2)}</p>
                      <div className="flex gap-2 mt-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveFromWishlist(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
} 