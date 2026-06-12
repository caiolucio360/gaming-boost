import type { Metadata, Viewport } from 'next'
import { Orbitron, Rajdhani, Knewave } from 'next/font/google'
import './globals.css'
import { ConditionalShell } from '@/components/layout/conditional-shell'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProviderWrapper } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { SkipLink } from '@/components/common/skip-link'
import { LiveRegion } from '@/components/common/live-region'

import { QueryProvider } from '@/providers/query-provider'

const knewave = Knewave({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-brush',   // vira uma CSS var
  display: 'swap',
})

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

// Next 15 exige `viewport`/`themeColor` num export separado (não dentro de `metadata`).
// themeColor segue o tema claro/escuro (combina com a barra do navegador no mobile).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = generateMetadata({
  title: 'FlautasBoost - Serviços de Boost para Jogos',
  description: 'Subimos seu rank com segurança e rapidez. Boosters verificados, entrega garantida.',
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
  canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flautasboost.com.br',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${rajdhani.variable} ${knewave.variable} font-rajdhani bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProviderWrapper>
              <ToastProvider />
              <SkipLink />
              <LiveRegion message="" id="live-region" />
              <ConditionalShell>
                {children}
              </ConditionalShell>
            </AuthProviderWrapper>
          </QueryProvider>
          <AnalyticsProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}