import React from 'react'
import { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import ProductsList from './ProductsList'

export const metadata: Metadata = {
  title: 'Products | My Shop',
  description: 'Browse our collection of products',
}

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Our Products</h1>
        <ProductsList />
      </main>
    </>
  )
} 