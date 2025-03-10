'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/services/product-service'
import { useCart } from '@/lib/contexts/CartContext'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, Minus, Plus, ShoppingCart, Heart } from 'lucide-react'
import { addToWishlist, removeFromWishlist, isInWishlist } from '@/lib/services/wishlist-service'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [isInWishlistState, setIsInWishlistState] = useState(false)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)

  useEffect(() => {
    // Check if product is in wishlist when component mounts
    const checkWishlist = async () => {
      if (user) {
        try {
          const inWishlist = await isInWishlist(user.id, product.id!)
          setIsInWishlistState(inWishlist)
        } catch (error) {
          console.error('Error checking wishlist:', error)
        }
      }
    }

    checkWishlist()
  }, [user, product.id])

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= (product.stock || 0)) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    toast.success(`${product.name} added to cart`)
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please log in to add items to your wishlist')
      return
    }

    try {
      setIsWishlistLoading(true)
      if (isInWishlistState) {
        await removeFromWishlist(user.id, product.id!)
        setIsInWishlistState(false)
        toast.success('Removed from wishlist')
      } else {
        await addToWishlist(user.id, product.id!)
        setIsInWishlistState(true)
        toast.success('Added to wishlist')
      }
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast.error('Failed to update wishlist')
    } finally {
      setIsWishlistLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/products" className="flex items-center text-blue-600 hover:text-blue-800">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {product.category && (
            <div className="mb-4">
              <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">
                {product.category}
              </span>
            </div>
          )}
          
          <p className="text-2xl font-bold text-blue-600 mb-4">
            ${product.price.toFixed(2)}
          </p>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description || 'No description available.'}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Availability</h2>
            <p className={`${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 
                ? `In Stock (${product.stock} available)` 
                : 'Out of Stock'}
            </p>
          </div>
          
          {product.stock > 0 && (
            <Card className="p-4 mb-6">
              <div className="flex items-center mb-4">
                <span className="mr-4">Quantity:</span>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleAddToCart} 
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className={isInWishlistState ? 'bg-pink-50' : ''}
                >
                  <Heart className={`h-4 w-4 ${isInWishlistState ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 