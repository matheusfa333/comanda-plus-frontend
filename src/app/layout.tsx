import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Comanda+',
  description: 'Sistema de gestão de restaurante',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#faf6ef] text-[#2a1f14]">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
