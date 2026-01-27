import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Shield, Zap, Clock, MessageCircle, CreditCard } from 'lucide-react'
import Link from 'next/link'

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
    description: 'Um booster profissional verificado aceita seu pedido e inicia o trabalho.',
    icon: Shield,
  },
  {
    number: '04',
    title: 'Acompanhe e Receba',
    description: 'Acompanhe o progresso em tempo real. Receba sua conta no rank desejado!',
    icon: CheckCircle,
  },
]

const features = [
  {
    icon: Shield,
    title: 'Boosters Verificados',
    description: 'Todos os boosters passam por verificação rigorosa.',
  },
  {
    icon: MessageCircle,
    title: 'Suporte 24/7',
    description: 'Atendimento via WhatsApp a qualquer momento.',
  },
  {
    icon: CheckCircle,
    title: 'Garantia de Reembolso',
    description: 'Não ficou satisfeito? Devolvemos seu dinheiro.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-orbitron mb-4">
            <span className="text-brand-purple-light">COMO</span> FUNCIONA
          </h1>
          <p className="text-lg text-gray-300 font-rajdhani max-w-2xl mx-auto">
            Processo simples e seguro em 4 passos
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className="relative bg-brand-black-light border-brand-purple/30 hover:border-brand-purple/60 transition-all duration-300 overflow-hidden group"
            >
              <CardContent className="p-6">
                {/* Step Number */}
                <div className="text-5xl font-black text-brand-purple/20 font-orbitron absolute top-2 right-4">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-brand-purple/20 flex items-center justify-center mb-4 group-hover:bg-brand-purple/30 transition-colors">
                  <step.icon className="h-6 w-6 text-brand-purple-light" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-bold text-white font-orbitron mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 font-rajdhani">
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
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">{feature.title}</h4>
                <p className="text-sm text-gray-400 font-rajdhani">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/games/cs2"
            className="inline-flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-glow hover:shadow-glow-hover font-rajdhani text-lg"
          >
            <Zap className="h-5 w-5" />
            Começar Agora
          </Link>
        </div>
      </div>
    </div>
  )
}
