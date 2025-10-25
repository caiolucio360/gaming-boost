import type { Metadata } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'
import { ElojobHeader } from '@/components/layout/elojob-header'
import { Footer } from '@/components/layout/footer'

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

export const metadata: Metadata = {
  title: 'GameBoost Pro - Serviços de Boost para Jogos',
  description: 'Plataforma profissional para serviços de boost em League of Legends, Valorant e Counter-Strike 2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${orbitron.variable} ${rajdhani.variable} font-rajdhani text-white bg-black`}>
        <div className="min-h-screen flex flex-col overflow-x-hidden">
          <ElojobHeader />
          <main className="flex-1 pt-16">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}