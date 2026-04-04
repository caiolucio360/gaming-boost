import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle,
  Shield,
  Zap,
  MessageCircle,
  CreditCard,
  Lock,
  Bell,
  Camera,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

const DISCORD_URL = 'https://discord.gg/gameboost'

export const metadata: Metadata = generateMetadata({
  title: 'Como Funciona - GameBoost',
  description: 'Entenda como funciona o serviço de boost da GameBoost. Processo simples, seguro e rápido em 4 passos.',
  keywords: ['como funciona boost', 'processo boost cs2', 'boost seguro', 'boost rápido'],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/how-it-works`,
})

const steps = [
  {
    number: '01',
    title: 'Escolha seu Boost',
    description: 'Selecione sua pontuação atual e a desejada. Nosso calculador mostra o preço instantaneamente.',
    icon: Zap,
  },
  {
    number: '02',
    title: 'Pagamento Seguro',
    description: 'Pague via PIX de forma rápida e segura. Seu pedido é confirmado automaticamente.',
    icon: CreditCard,
  },
  {
    number: '03',
    title: 'Booster Designado',
    description: 'Um booster profissional verificado aceita seu pedido. Você envia suas credenciais Steam pelo chat criptografado.',
    icon: Shield,
  },
  {
    number: '04',
    title: 'Acompanhe e Receba',
    description: 'Acompanhe o progresso pelo chat em tempo real. O booster envia prova de conclusão antes de finalizar.',
    icon: CheckCircle,
  },
]

const features = [
  {
    icon: Shield,
    title: 'Boosters Verificados',
    description: 'Todos os boosters passam por verificação rigorosa antes de serem aprovados na plataforma.',
  },
  {
    icon: Lock,
    title: 'Credenciais Criptografadas',
    description: 'Suas credenciais Steam são enviadas pelo chat com criptografia AES-256 e apagadas automaticamente ao final do serviço.',
  },
  {
    icon: Camera,
    title: 'Prova de Conclusão',
    description: 'O booster deve enviar um print comprovando que atingiu o rank desejado antes de marcar o pedido como concluído.',
  },
  {
    icon: MessageCircle,
    title: 'Chat em Tempo Real',
    description: 'Comunique-se diretamente com seu booster pelo chat da plataforma durante todo o serviço.',
  },
  {
    icon: Bell,
    title: 'Notificações em Tempo Real',
    description: 'Receba notificações a cada atualização do seu pedido: booster designado, progresso e conclusão.',
  },
  {
    icon: RefreshCw,
    title: 'Reembolso Automático',
    description: 'Se nenhum booster aceitar seu pedido em até 24h, o valor é reembolsado automaticamente via PIX.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-brand-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <span className="text-brand-purple-light">COMO</span> FUNCIONA
          </h1>
          <p className="text-lg text-brand-gray-300 font-rajdhani max-w-2xl mx-auto" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Processo simples e seguro em 4 passos
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className="relative bg-brand-black-light border-brand-purple/30 hover:border-brand-purple/60 hover:shadow-lg hover:shadow-brand-purple/20 transition-all duration-300 overflow-hidden group"
            >
              <CardContent className="p-6">
                {/* Step Number */}
                <div className="text-5xl font-black text-brand-purple/20 font-orbitron absolute top-2 right-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-brand-purple/20 flex items-center justify-center mb-4 group-hover:bg-brand-purple/30 transition-colors">
                  <step.icon className="h-6 w-6 text-brand-purple-light" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {step.title}
                </h3>
                <p className="text-sm text-brand-gray-400 font-rajdhani leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {step.description}
                </p>

                {/* Connector line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-brand-purple/30" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white font-orbitron text-center mb-10" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            POR QUE <span className="text-brand-purple-light">ESCOLHER</span> A GAMEBOOST
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-5 rounded-lg bg-brand-purple/5 border border-brand-purple/20 hover:border-brand-purple/40 hover:bg-brand-purple/10 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-brand-purple-light" />
                </div>
                <div>
                  <h4 className="font-bold text-white font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{feature.title}</h4>
                  <p className="text-sm text-brand-gray-400 font-rajdhani leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link
            href="/games/cs2"
            className="inline-flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-glow hover:shadow-glow-hover font-rajdhani text-lg"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Zap className="h-5 w-5" />
            Começar Agora
          </Link>
          <p className="text-sm text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Dúvidas?{' '}
            <Link href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-brand-purple-light hover:text-brand-purple-lighter transition-colors">
              Fale conosco no Discord
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
