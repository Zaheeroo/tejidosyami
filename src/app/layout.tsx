import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/SupabaseAuthContext'
import { CartProvider } from '@/lib/contexts/CartContext'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
