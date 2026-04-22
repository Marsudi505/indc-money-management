import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'INDC Money Management',
  description: 'Sistem manajemen keuangan event INDC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
