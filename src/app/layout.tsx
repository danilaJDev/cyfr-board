import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CYFR Board',
  description: 'Управление проектами, разрешениями и задачами CYFR FITOUT L.L.C',
  icons: {
    icon: '/cyfr-logo-gold.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
