import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-heading',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'High Point Search',
  description: 'Connecting experienced talent with the right opportunities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  )
}