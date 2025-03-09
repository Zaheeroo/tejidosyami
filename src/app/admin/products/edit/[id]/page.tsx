'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/SupabaseAuthContext'
import { isAdmin } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import ProductForm from '../../ProductForm'
import { getProductById, Product } from '@/lib/services/product-service'
import { toast } from 'sonner'

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user is not loading and either not logged in or not an admin, redirect to home
    if (!loading && (!user || !isAdmin(user))) {
      toast.error('You do not have permission to access this page')
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProduct = async () => {
      if (!user || !isAdmin(user)) return

      try {
        setIsLoading(true)
        const data = await getProductById(params.id)
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
        setError('Failed to load product')
        toast.error('Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin(user)) {
      fetchProduct()
    }
  }, [user, params.id])

  // Don't render anything while checking authentication
  if (loading || !user || !isAdmin(user)) {
    return null
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-10">
            <p className="text-red-500">{error || 'Product not found'}</p>
            <button 
              onClick={() => router.push('/admin/products')} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Products
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
        <ProductForm product={product} isEditing={true} />
      </main>
    </>
  )
} 