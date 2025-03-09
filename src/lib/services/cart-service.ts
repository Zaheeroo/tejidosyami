'use client'

import { Product } from './product-service';

export interface CartItem {
  product: Product;
  quantity: number;
}

// Use localStorage to persist the cart
const CART_STORAGE_KEY = 'shopping_cart';

// Get cart from localStorage
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const cartJson = localStorage.getItem(CART_STORAGE_KEY);
  return cartJson ? JSON.parse(cartJson) : [];
}

// Save cart to localStorage
export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Add product to cart
export function addToCart(product: Product, quantity: number = 1): CartItem[] {
  const cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
  
  if (existingItemIndex >= 0) {
    // Update quantity if product already in cart
    cart[existingItemIndex].quantity += quantity;
  } else {
    // Add new item to cart
    cart.push({ product, quantity });
  }
  
  saveCart(cart);
  return cart;
}

// Update product quantity in cart
export function updateCartItemQuantity(productId: string, quantity: number): CartItem[] {
  const cart = getCart();
  const itemIndex = cart.findIndex(item => item.product.id === productId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart[itemIndex].quantity = quantity;
    }
    
    saveCart(cart);
  }
  
  return cart;
}

// Remove product from cart
export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart();
  const updatedCart = cart.filter(item => item.product.id !== productId);
  
  saveCart(updatedCart);
  return updatedCart;
}

// Clear cart
export function clearCart(): void {
  saveCart([]);
}

// Calculate cart total
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}

// Get cart item count
export function getCartItemCount(): number {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
} 