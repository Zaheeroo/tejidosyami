import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProductsList from './ProductsList'
import { ChevronLeft, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Handcrafted Crochet Collection',
  description: 'Browse our collection of handcrafted crochet items made with love',
}

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link href="/customer/dashboard" className="flex items-center text-rose-600 hover:text-rose-700 transition-colors mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            
            <div className="relative mb-6 rounded-xl bg-gradient-to-r from-rose-100 to-teal-100 p-6 md:p-8 shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FF9D9D" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-1.5C87,13.3,81.3,26.6,73.6,39.1C65.9,51.6,56.1,63.2,43.7,70.7C31.3,78.1,15.7,81.4,0.4,80.8C-14.9,80.1,-29.9,75.5,-43.4,68.1C-56.9,60.7,-69,50.4,-76.2,37.4C-83.5,24.4,-86,8.7,-83.9,-5.8C-81.8,-20.2,-75.1,-33.3,-65.7,-43.9C-56.3,-54.5,-44.1,-62.5,-31.6,-70.4C-19.1,-78.2,-6.4,-85.9,6.9,-87.1C20.2,-88.3,40.5,-83,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
              </div>
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Our Crochet Collection</h1>
                <p className="text-gray-600 mb-2 max-w-2xl">Discover our handcrafted crochet items made with love and attention to detail. Each piece is unique and created with premium materials.</p>
                <div className="flex items-center text-rose-600">
                  <Sparkles className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Handmade with care</span>
                </div>
              </div>
            </div>
          </div>
          
          <ProductsList />
        </div>
      </main>
    </>
  )
} 