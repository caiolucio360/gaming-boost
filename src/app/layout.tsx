import type { Metadata } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'
import { AuthProviderWrapper } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { SkipLink } from '@/components/common/skip-link'
import { LiveRegion } from '@/components/common/live-region'
import { MotionProvider } from '@/components/providers/motion-provider'

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '700', '800', '900'], // Apenas pesos utilizados
  display: 'swap', // Melhora performance de carregamento
  preload: true,
})

const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['300', '400', '500', '600'], // Apenas pesos utilizados
  display: 'swap', // Melhora performance de carregamento
  preload: true,
})

import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'GameBoost - Serviços de Boost para Jogos',
  description: 'Plataforma profissional para serviços de boost em Counter-Strike 2. Boost de rank Premier e Gamers Club com boosters verificados. Entrega rápida e segura. Mais de 10.000 clientes satisfeitos.',
  keywords: [
    'counter strike 2',
    'cs2',
    'counter strike',
    'cs',
    'cs2 boost',
    'cs2 rank boost',
    'cs2 premier boost',
    'cs2 gamers club boost',
    'cs2 boost profissional',
    'cs2 boost seguro',
    'cs2 boost rapido',
    'boost cs2',
    'boost counter strike 2',
    'elo job cs2',
    'rank boost cs2',
    'boost premier cs2',
    'boost gamers club',
    'serviço de boost',
    'boost profissional',
    'boost seguro cs2',
    'elo job',
    'elojob',
    'elojob cs2',
    'gameboost'
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
          <MotionProvider>
            <ToastProvider />
            <SkipLink />
            <LiveRegion message="" id="live-region" />
            <div className="min-h-screen flex flex-col overflow-x-hidden">
            <ElojobHeader />
            <main id="main-content" className="flex-1 pt-16" role="main" aria-label="Conteúdo principal">
              {children}
            </main>
            <Footer />
          </div>
          </MotionProvider>
        </AuthProviderWrapper>
        <AnalyticsProvider />
      </body>
    </html>
  )
}