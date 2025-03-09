'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '../services/product-service'
import { 
  CartItem, 
  getCart, 
  saveCart, 
  addToCart as addToCartService,
  updateCartItemQuantity as updateCartItemQuantityService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService,
  getCartTotal,
  getCartItemCount
} from '../services/cart-service'

type CartContextType = {
  cart: CartItem[]
  cartTotal: number
  cartItemCount: number
  addToCart: (product: Product, quantity?: number) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState<number>(0)
  const [cartItemCount, setCartItemCount] = useState<number>(0)

  // Initialize cart from localStorage
  useEffect(() => {
    const savedCart = getCart()
    setCart(savedCart)
    setCartTotal(getCartTotal())
    setCartItemCount(getCartItemCount())
  }, [])

  const addToCart = (product: Product, quantity: number = 1) => {
    const updatedCart = addToCartService(product, quantity)
    setCart(updatedCart)
    setCartTotal(getCartTotal())
    setCartItemCount(getCartItemCount())
  }

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    const updatedCart = updateCartItemQuantityService(productId, quantity)
    setCart(updatedCart)
    setCartTotal(getCartTotal())
    setCartItemCount(getCartItemCount())
  }

  const removeFromCart = (productId: string) => {
    const updatedCart = removeFromCartService(productId)
    setCart(updatedCart)
    setCartTotal(getCartTotal())
    setCartItemCount(getCartItemCount())
  }

  const clearCart = () => {
    clearCartService()
    setCart([])
    setCartTotal(0)
    setCartItemCount(0)
  }

  const value = {
    cart,
    cartTotal,
    cartItemCount,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 