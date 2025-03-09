import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from '@supabase/supabase-js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to check if a user is an admin
// For now, we'll use a simple email check, but in a real app,
// you would use Supabase's user metadata or a separate table
export function isAdmin(user: User | null): boolean {
  if (!user) return false
  
  // Check if the user's email contains 'admin'
  // In a real application, you would use a more robust method
  return user.email?.includes('admin') || false
}

// Function to check if a user is a customer
export function isCustomer(user: User | null): boolean {
  if (!user) return false
  
  // If the user is not an admin, they are a customer
  return !isAdmin(user)
}
