import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from '@supabase/supabase-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to check if a user is an admin
export function isAdmin(user: User | null): boolean {
  if (!user) return false
  
  // Check if the user has role metadata
  if (user.user_metadata && user.user_metadata.role === 'admin') {
    return true
  }
  
  // Fallback to email check if no metadata
  return user.email?.includes('admin') || false
}

// Function to check if a user is a customer
export function isCustomer(user: User | null): boolean {
  if (!user) return false
  
  // Check if the user has role metadata
  if (user.user_metadata && user.user_metadata.role === 'customer') {
    return true
  }
  
  // If the user is not an admin, they are a customer
  return !isAdmin(user)
}
