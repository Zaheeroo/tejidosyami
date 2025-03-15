'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/services/product-service'
import { useCart } from '@/lib/contexts/CartContext'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ChevronLeft, Minus, Plus, ShoppingCart, Heart, Star, Truck, Shield, Clock, ArrowRight } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('description')

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

  // Generate random rating for demo purposes
  const rating = Math.floor(Math.random() * 5) + 3.5;
  const reviewCount = Math.floor(Math.random() * 50) + 10;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
      <div className="mb-6">
        <Link href="/products" className="flex items-center text-rose-600 hover:text-rose-700 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image Section */}
        <div className="space-y-4">
          <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-gray-100">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover transition-transform hover:scale-105 duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
            {isInWishlistState && (
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm">
                <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
              </div>
            )}
          </div>
          
          {/* Product Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-rose-50 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-2">
                <Truck className="h-5 w-5 text-rose-500" />
              </div>
              <p className="text-xs text-gray-700">Free Shipping</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-2">
                <Shield className="h-5 w-5 text-teal-500" />
              </div>
              <p className="text-xs text-gray-700">Quality Guarantee</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="flex justify-center mb-2">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-xs text-gray-700">Handmade with Care</p>
            </div>
          </div>
        </div>
        
        {/* Product Details Section */}
        <div className="flex flex-col">
          {/* Product Category */}
          {product.category && (
            <div className="mb-2">
              <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                {product.category}
              </span>
            </div>
          )}
          
          {/* Product Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          
          {/* Product Rating */}
          <div className="flex items-center mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">{rating.toFixed(1)} ({reviewCount} reviews)</span>
          </div>
          
          {/* Product Price */}
          <div className="mb-6">
            <p className="text-3xl font-bold text-gray-800">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Includes all taxes and fees
            </p>
          </div>
          
          {/* Product Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'description' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'details' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'care' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('care')}
              >
                Care Instructions
              </button>
            </div>
            
            <div className="py-4">
              {activeTab === 'description' && (
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              )}
              
              {activeTab === 'details' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <span className="font-medium">Material:</span> Premium cotton yarn
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Dimensions:</span> Varies by product
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Weight:</span> Lightweight
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Made in:</span> Handcrafted with love
                  </p>
                </div>
              )}
              
              {activeTab === 'care' && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <span className="font-medium">Washing:</span> Hand wash with mild soap in lukewarm water
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Drying:</span> Lay flat to dry to maintain shape
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Storage:</span> Store in a cool, dry place away from direct sunlight
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Availability */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <p className={`text-sm font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {product.stock > 0 
                  ? `In Stock (${product.stock} available)` 
                  : 'Out of Stock'}
              </p>
            </div>
          </div>
          
          {/* Add to Cart Section */}
          {product.stock > 0 ? (
            <Card className="border-0 shadow-sm bg-gray-50 overflow-hidden mt-auto">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-gray-700 mr-4">Quantity:</span>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="h-8 w-8 border-gray-300 text-gray-700"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="mx-4 w-8 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="h-8 w-8 border-gray-300 text-gray-700"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAddToCart} 
                    className="flex-1 bg-rose-500 hover:bg-rose-600"
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
                    className={`border-gray-300 ${isInWishlistState ? 'bg-rose-50 border-rose-200' : ''}`}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlistState ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm bg-gray-50 overflow-hidden mt-auto">
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">This item is currently out of stock. Sign up to be notified when it becomes available.</p>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Notify Me When Available
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Related Products Link */}
          <div className="mt-6">
            <Link href="/products" className="text-sm text-rose-600 hover:text-rose-700 flex items-center">
              Browse more crochet products
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 