'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PaymentFormProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName?: string;
  description?: string;
}

// Test card data
const TEST_CARDS = [
  { type: 'Visa', number: '4242 4242 4242 4242', name: 'John Doe', scenario: 'Successful payment' },
  { type: 'Visa', number: '4111 1111 1111 1111', name: 'Mona Doe', scenario: 'Insufficient funds' },
  { type: 'Mastercard', number: '5555 5555 5555 4444', name: 'Mark Doe', scenario: 'Try again later' },
  { type: 'Mastercard', number: '5454 5454 5454 5454', name: 'Red Doe', scenario: 'Stolen card' },
  { type: 'Amex', number: '3782 8224 6310 005', name: 'Joy Doe', scenario: 'Authentication failed' },
  { type: 'Discover', number: '6011 1111 1111 1117', name: 'Angela Doe', scenario: 'Expired card' },
  { type: 'JCB', number: '3566 1111 1111 1113', name: 'Adrian Doe', scenario: 'Invalid card number' },
];

export default function PaymentForm({
  orderId,
  amount,
  customerEmail,
  customerName = '',
  description = ''
}: PaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTestCard, setSelectedTestCard] = useState('');
  const [paymentMode, setPaymentMode] = useState('normal');
  
  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      // Create the payment request
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'USD', // Change as needed
          orderId,
          customerEmail,
          customerName: paymentMode === 'test' && selectedTestCard 
            ? TEST_CARDS.find(card => card.number === selectedTestCard)?.name || customerName
            : customerName,
          description: description || `Payment for order ${orderId}`,
          redirectUrl: `${window.location.origin}/checkout/success?orderId=${orderId}`,
          callbackUrl: `${window.location.origin}/api/payments/webhook`,
          testMode: paymentMode === 'test',
          testCardNumber: paymentMode === 'test' ? selectedTestCard.replace(/\s/g, '') : undefined
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.paymentUrl) {
        // Redirect to Onvopay payment page
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.error || 'Failed to initiate payment');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          You will be redirected to Onvopay to complete your payment securely.
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="normal" onValueChange={setPaymentMode}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="normal">Normal Payment</TabsTrigger>
            <TabsTrigger value="test">Test Payment</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="normal">
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Order ID</Label>
                <Input id="order-id" value={orderId} disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input 
                  id="amount" 
                  value={`$${amount.toFixed(2)}`} 
                  disabled 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={customerEmail} 
                  disabled 
                />
              </div>
              
              {description && (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={description} 
                    disabled 
                  />
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="test">
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-card">Select a Test Card</Label>
                <Select 
                  value={selectedTestCard} 
                  onValueChange={setSelectedTestCard}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a test card" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_CARDS.map((card) => (
                      <SelectItem key={card.number} value={card.number}>
                        {card.type} - {card.scenario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTestCard && (
                <div className="space-y-2 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">Test Card Details:</p>
                  <p className="text-sm">Card Number: {selectedTestCard}</p>
                  <p className="text-sm">Name: {TEST_CARDS.find(card => card.number === selectedTestCard)?.name}</p>
                  <p className="text-sm">Scenario: {TEST_CARDS.find(card => card.number === selectedTestCard)?.scenario}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use any future expiration date and any 3-digit CVV.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="test-amount">Amount</Label>
                <Input 
                  id="test-amount" 
                  value={`$${amount.toFixed(2)}`} 
                  disabled 
                />
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex flex-col space-y-4">
        <Button 
          className="w-full" 
          onClick={handlePayment}
          disabled={isLoading || (paymentMode === 'test' && !selectedTestCard)}
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Button>
        
        {paymentMode === 'test' && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="test-info">
              <AccordionTrigger className="text-sm">About Test Payments</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  These test cards simulate different payment scenarios. In a real environment, 
                  these would trigger specific responses from the payment gateway. All test 
                  transactions are recorded in your Onvopay dashboard but no actual charges are made.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardFooter>
    </Card>
  );
} 