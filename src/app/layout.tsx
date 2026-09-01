import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Peshwazi | Menu',
  description: 'Peshwazi restaurant & cafe digital menu',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>
}
