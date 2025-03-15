import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductDetail from './ProductDetail'
import { getProductById, getProducts } from '@/lib/services/product-service'

interface ProductPageProps {
  params: {
    id: string
  }
}

// Set dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await getProductById(params.id)
    
    return {
      title: `${product.name} | Handcrafted Crochet`,
      description: product.description || `Details about our handcrafted ${product.name}`,
    }
  } catch (error) {
    return {
      title: 'Product Not Found | Handcrafted Crochet',
      description: 'The requested crochet product could not be found.',
    }
  }
}

export async function generateStaticParams() {
  try {
    const products = await getProducts()
    
    return products.map(product => ({
      id: product.id,
    }))
  } catch (error) {
    return []
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const product = await getProductById(params.id)
    
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto px-4 py-8">
            <ProductDetail product={product} />
            
            {/* Related Products Section - This would be implemented in a real app */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">You Might Also Like</h2>
              <p className="text-gray-600 mb-8">Other handcrafted items you may enjoy</p>
              
              {/* This would be populated with actual related products in a real implementation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Placeholder for related products */}
              </div>
            </div>
          </div>
        </main>
      </>
    )
  } catch (error) {
    notFound()
  }
} 