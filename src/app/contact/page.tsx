'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, MapPin, MessageCircle, Shield, Headphones } from 'lucide-react'

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || '#'

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-orbitron mb-4">
            <span className="text-brand-purple-light">SUPORTE</span> AO CLIENTE
          </h1>
          <p className="text-lg text-brand-gray-300 font-rajdhani max-w-2xl mx-auto">
            Entre no nosso servidor do Discord para suporte rápido e direto!
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Discord CTA Card */}
          <Card className="bg-brand-black-light border-brand-purple/30">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#5865F2]/20 flex items-center justify-center mx-auto mb-6">
                <DiscordIcon className="h-10 w-10 text-[#5865F2]" />
              </div>
              <h2 className="text-2xl font-bold text-white font-orbitron mb-3">
                DISCORD
              </h2>
              <p className="text-brand-gray-300 font-rajdhani mb-6 leading-relaxed">
                Nosso time de suporte está disponível 24/7 no Discord.
                Tire dúvidas, acompanhe pedidos e fale diretamente conosco.
              </p>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-[#5865F2]/30 font-rajdhani text-lg"
              >
                <DiscordIcon className="h-5 w-5" />
                Entrar no Discord
              </a>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid gap-3 mt-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Resposta Rápida</h4>
                <p className="text-sm text-brand-gray-400 font-rajdhani">Suporte em tempo real via chat</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Canais de Voz</h4>
                <p className="text-sm text-brand-gray-400 font-rajdhani">Fale diretamente com a equipe se necessário</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Comunidade Segura</h4>
                <p className="text-sm text-brand-gray-400 font-rajdhani">Servidor moderado com canais organizados</p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Horário de Atendimento</h4>
                <p className="text-sm text-brand-gray-400 font-rajdhani">24 horas por dia, 7 dias por semana</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Localização</h4>
                <p className="text-sm text-brand-gray-400 font-rajdhani">100% Online - Atendemos todo o Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
