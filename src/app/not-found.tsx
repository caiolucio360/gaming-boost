import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Página Não Encontrada - 404',
  description: 'A página que você está procurando não foi encontrada. Volte para a página inicial ou explore nossos serviços de boost.',
  noindex: true,
})

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-3xl xl:max-w-4xl mx-auto text-center">
        {/* Número 404 Grande */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '900' }}>
            <span className="text-purple-500/20">4</span>
            <span className="text-purple-400/30">0</span>
            <span className="text-purple-500/20">4</span>
          </h1>
        </div>

        {/* Card Principal */}
        <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8 md:p-12 mb-8">
          <div className="mb-6">
            <div className="inline-block bg-purple-500/20 rounded-full p-4 mb-4">
              <Search className="h-12 w-12 text-purple-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
              <span className="text-purple-300">PÁGINA</span>
              <span className="text-white"> NÃO ENCONTRADA</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Ops! A página que você está procurando não existe ou foi movida.
            </p>
            <p className="text-base text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
              Mas não se preocupe, você ainda pode encontrar nossos serviços de boost!
            </p>
          </div>

          {/* Links Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
            <Link href="/games/cs2">
              <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <h3 className="text-white font-bold font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="text-purple-300">COUNTER-STRIKE 2</span>
                </h3>
                <p className="text-sm text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Ver serviços de boost
                </p>
              </div>
            </Link>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani font-bold py-6 px-8 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Voltar para Início
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 font-rajdhani font-bold py-6 px-8 transition-all duration-300"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            >
              <Link href="/games/cs2">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Explorar Serviços
              </Link>
            </Button>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="text-center">
          <p className="text-sm text-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
            Precisa de ajuda?{' '}
            <Link href="/contact" className="text-purple-400 hover:text-purple-300 transition-colors">
              Entre em contato
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

