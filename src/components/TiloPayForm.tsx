'use client';

import React, { useEffect, useState } from 'react';
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
import Script from 'next/script';

interface TilopayFormProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName?: string;
  description?: string;
}

// Test card data for Tilopay
const TEST_CARDS = [
  { type: 'Visa', number: '4012 0000 0002 0071', name: 'John Doe', scenario: 'Successful payment' },
  { type: 'Visa', number: '4012 0000 0002 0089', name: 'Jane Doe', scenario: 'Successful payment' },
  { type: 'Visa', number: '4012 0000 0002 0121', name: 'Mark Smith', scenario: 'Authorization denied' },
  { type: 'Visa', number: '4111 1111 1111 9999', name: 'Lisa Johnson', scenario: 'Authorization denied' },
  { type: 'Visa', number: '4112 6134 5159 1116', name: 'Robert Brown', scenario: 'Insufficient funds' },
  { type: 'Visa', number: '4523 0803 4646 8525', name: 'Emily Davis', scenario: 'Invalid CVV' },
  { type: 'Visa', number: '4549 1799 9047 6733', name: 'Michael Wilson', scenario: 'Lost or stolen card' },
];

const TilopayForm: React.FC<TilopayFormProps> = ({
  orderId,
  amount,
  customerEmail,
  customerName = '',
  description = ''
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTestCard, setSelectedTestCard] = useState('');
  const [paymentMode, setPaymentMode] = useState('normal');
  const [tilopayLoaded, setTilopayLoaded] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName);
  
  // Initialize Tilopay SDK when the script is loaded
  useEffect(() => {
    if (tilopayLoaded && window.Tilopay) {
      const publicKey = process.env.NEXT_PUBLIC_TILOPAY_PUBLIC_KEY || '';
      
      window.Tilopay.initialize({
        publicKey: publicKey,
        // Optional configuration
        locale: 'en',
        environment: 'test', // Use 'production' for live transactions
      });
      
      console.log('Tilopay SDK initialized');
    }
  }, [tilopayLoaded]);
  
  const handleTilopayScriptLoad = () => {
    console.log('Tilopay SDK script loaded');
    setTilopayLoaded(true);
  };
  
  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      if (paymentMode === 'normal') {
        // For normal payment mode, use Tilopay SDK
        if (!window.Tilopay) {
          toast.error('Tilopay SDK not loaded');
          setIsLoading(false);
          return;
        }
        
        // Create a payment token with Tilopay
        const tokenResult = await window.Tilopay.createToken({
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: cardExpiry.split('/')[0].trim(),
            exp_year: '20' + cardExpiry.split('/')[1].trim(),
            cvc: cardCvv,
            name: cardHolder,
          },
        });
        
        if (tokenResult.error) {
          toast.error(tokenResult.error.message || 'Failed to create payment token');
          setIsLoading(false);
          return;
        }
        
        // Process the payment with the token
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            paymentToken: tokenResult.token,
            amount,
            currency: 'USD',
            customerEmail,
            customerName: cardHolder,
            description: description || `Payment for order ${orderId}`,
            provider: 'tilopay',
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Payment successful!');
          router.push(`/checkout/success?orderId=${orderId}`);
        } else {
          toast.error(data.error || 'Payment failed');
          setIsLoading(false);
        }
      } else {
        // For test payment mode, use test cards
        // Create the payment request
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: 'USD',
            orderId,
            customerEmail,
            customerName: TEST_CARDS.find(card => card.number === selectedTestCard)?.name || customerName,
            description: description || `Payment for order ${orderId}`,
            redirectUrl: `${window.location.origin}/checkout/success?orderId=${orderId}`,
            callbackUrl: `${window.location.origin}/api/payments/webhook`,
            testMode: true,
            testCardNumber: selectedTestCard.replace(/\s/g, ''),
            provider: 'tilopay',
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.paymentUrl) {
          // Redirect to payment page
          window.location.href = data.paymentUrl;
        } else {
          toast.error(data.error || 'Failed to initiate payment');
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format card expiry as MM/YY
  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    } else if (v.length === 2) {
      return `${v}/`;
    } else {
      return v;
    }
  };
  
  return (
    <>
      {/* Load Tilopay SDK */}
      <Script
        src={process.env.NEXT_PUBLIC_TILOPAY_SDK_URL || 'https://tilopay.com/js/v1'}
        onLoad={handleTilopayScriptLoad}
        strategy="lazyOnload"
      />
      
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Secure payment processing by Tilopay
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="normal" onValueChange={setPaymentMode}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal">Card Payment</TabsTrigger>
              <TabsTrigger value="test">Test Payment</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="normal">
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="card-cvv">CVV</Label>
                    <Input
                      id="card-cvv"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card-holder">Card Holder Name</Label>
                  <Input
                    id="card-holder"
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount" 
                    value={`$${amount.toFixed(2)}`} 
                    disabled 
                  />
                </div>
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
                      Use any future expiration date and any 3-digit CVV. For 3DS testing, use password: 3ds2
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
            disabled={isLoading || 
              (paymentMode === 'test' && !selectedTestCard) || 
              (paymentMode === 'normal' && (!cardNumber || !cardExpiry || !cardCvv || !cardHolder))}
          >
            {isLoading ? 'Processing...' : 'Pay Now'}
          </Button>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="test-info">
              <AccordionTrigger className="text-sm">About Tilopay Payments</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Tilopay provides secure payment processing. In test mode, you can use the provided test cards to 
                  simulate different payment scenarios. All test transactions are recorded in your Tilopay dashboard 
                  but no actual charges are made.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      </Card>
    </>
  );
};

export default TilopayForm; 