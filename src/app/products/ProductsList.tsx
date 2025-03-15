'use client'

import React, { useState, useEffect } from 'react'
import { getProducts, Product } from '@/lib/services/product-service'
import ProductCard from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const data = await getProducts()
        setProducts(data)
        setFilteredProducts(data)
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map(product => product.category).filter(Boolean))
        ) as string[]
        
        setCategories(uniqueCategories)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    // Filter products based on search query and selected category
    let filtered = [...products]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(query) || 
          (product.description && product.description.toLowerCase().includes(query))
      )
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, products])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-rose-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-rose-500 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-sm p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
          <Package className="h-8 w-8 text-rose-500" />
        </div>
        <p className="text-rose-500 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-rose-500 hover:bg-rose-600"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Card className="border-0 shadow-sm bg-white mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search crochet items..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 border-gray-200 focus:border-rose-300 focus:ring-rose-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center">
              <div className="mr-2 text-gray-500">
                <Filter className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => handleCategorySelect(null)}
                  className={`text-sm ${selectedCategory === null ? 'bg-rose-500 hover:bg-rose-600' : 'border-gray-200 hover:bg-rose-50 hover:text-rose-600'}`}
                >
                  All Items
                </Button>
                
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => handleCategorySelect(category)}
                    className={`text-sm ${selectedCategory === category ? 'bg-rose-500 hover:bg-rose-600' : 'border-gray-200 hover:bg-rose-50 hover:text-rose-600'}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No crochet items found matching your search.</p>
          <Button 
            variant="outline" 
            onClick={() => {setSearchQuery(''); setSelectedCategory(null);}}
            className="border-gray-200 text-gray-700 hover:bg-gray-100"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="transform transition-transform hover:scale-105 duration-300">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 