'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'

export default function TestOrdersPage() {
  const [orders, setOrders] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createResult, setCreateResult] = useState<any>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTestOrder = async () => {
    try {
      setCreateLoading(true)
      const response = await fetch('/api/create-test-order')
      const data = await response.json()
      setCreateResult(data)
      // Refresh orders after creating a test order
      fetchOrders()
    } catch (error) {
      console.error('Error creating test order:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Test Orders</h1>
        
        <div className="mb-6">
          <Button 
            onClick={createTestOrder} 
            disabled={createLoading}
            className="mb-4"
          >
            {createLoading ? 'Creating...' : 'Create Test Order'}
          </Button>
          
          {createResult && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create Test Order Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(createResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Orders Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(orders, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
} 