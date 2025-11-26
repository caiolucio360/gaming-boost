'use client'

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent } from '@/components/ui/card'

export function Footer() {
  return (
    <footer className="relative bg-black text-white py-8 md:py-12 z-0" role="contentinfo" aria-label="Rodapé do site">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <Separator className="mb-8 md:mb-12 bg-purple-600" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Seção: Sobre */}
          <Card className="col-span-2 md:col-span-1 bg-transparent border-0 shadow-none p-0">
            <CardContent className="p-0">
              <div className="mb-3 md:mb-4">
                <h1 className="text-xl md:text-3xl font-black text-white drop-shadow-2xl font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                  <span className="text-purple-300 drop-shadow-2xl">GAME</span>
                  <span className="text-white drop-shadow-2xl">BOOST</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-400">
                Sua plataforma confiável para serviços de boost em jogos competitivos.
              </p>
            </CardContent>
          </Card>
          
          {/* Seção: Jogos */}
          <Card className="bg-transparent border-0 shadow-none p-0">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-3 md:mb-4 text-purple-400 text-sm md:text-base">Jogos</h3>
              <ul className="space-y-2">
                <li>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/games/cs2" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">
                          Counter-Strike 2
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                        <p>Serviços de boost para CS2</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Seção: Serviços */}
          <Card className="bg-transparent border-0 shadow-none p-0">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-3 md:mb-4 text-purple-400 text-sm md:text-base">Serviços</h3>
              <ul className="space-y-2">
                <li>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/games/cs2/pricing" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">
                          Boost de Rank
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                        <p>Subimos seu rank de forma segura e profissional</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
                <li className="flex items-center gap-2 cursor-not-allowed">
                  <span className="text-xs md:text-sm text-gray-500">Coaching</span>
                  <Badge variant="outline" className="text-xs border-purple-400/50 text-purple-400 bg-transparent">
                    em breve
                  </Badge>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Seção: Suporte */}
          <Card className="col-span-2 md:col-span-1 bg-transparent border-0 shadow-none p-0">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-3 md:mb-4 text-purple-400 text-sm md:text-base">Suporte</h3>
              <ul className="space-y-2">
                <li>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/contact" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">
                          Contato
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                        <p>Entre em contato conosco</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
                <li>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/terms" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">
                          Termos de Uso
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                        <p>Leia nossos termos e condições</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
                <li>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/privacy" className="text-xs md:text-sm text-gray-400 hover:text-purple-400 transition-colors">
                          Política de Privacidade
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                        <p>Como protegemos seus dados</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <Separator className="mt-6 md:mt-8 bg-purple-600" />
        
        <div className="pt-6 md:pt-8 text-center">
          <p className="text-xs md:text-sm text-gray-400">
            © 2025 GameBoost. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}