import type { Metadata } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'
import { AuthProviderWrapper } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { Analytics } from '@vercel/analytics/next';

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900']
})

const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['300', '400', '500', '600', '700']
})

import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'GameBoost Pro - Serviços de Boost para Jogos',
  description: 'Plataforma profissional para serviços de boost em Counter-Strike 2. Boost de rank Premier e Gamers Club com boosters verificados. Entrega rápida e segura.',
  keywords: [
    'boost cs2',
    'boost counter strike 2',
    'elo job cs2',
    'rank boost cs2',
    'boost premier cs2',
    'boost gamers club',
    'serviço de boost',
    'boost profissional',
    'boost seguro cs2',
  ],
  canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${orbitron.variable} ${rajdhani.variable} font-rajdhani text-white bg-black`}>
        <AuthProviderWrapper>
          <ToastProvider />
          <div className="min-h-screen flex flex-col overflow-x-hidden">
            <ElojobHeader />
            <main className="flex-1 pt-16">
              {children}
              <Analytics />
            </main>
            <Footer />
          </div>
        </AuthProviderWrapper>
      </body>
    </html>
  )
}