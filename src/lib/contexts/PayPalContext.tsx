'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalContextProps {
  children: ReactNode;
}

const PayPalContext = createContext<null>(null);

export function PayPalProvider({ children }: PayPalContextProps) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  
  const initialOptions = {
    clientId: paypalClientId,
    currency: 'USD',
    intent: 'capture',
  };
  
  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalContext.Provider value={null}>
        {children}
      </PayPalContext.Provider>
    </PayPalScriptProvider>
  );
}

export const usePayPal = () => useContext(PayPalContext); 