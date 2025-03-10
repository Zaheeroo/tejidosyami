import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProductsList from './ProductsList'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Products | My Shop',
  description: 'Browse our collection of products',
}

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/customer/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Our Products</h1>
        </div>
        <ProductsList />
      </main>
    </>
  )
} 