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
      title: `${product.name} | My Shop`,
      description: product.description || `Details about ${product.name}`,
    }
  } catch (error) {
    return {
      title: 'Product Not Found | My Shop',
      description: 'The requested product could not be found.',
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
        <main className="container mx-auto px-4 py-8">
          <ProductDetail product={product} />
        </main>
      </>
    )
  } catch (error) {
    notFound()
  }
} 