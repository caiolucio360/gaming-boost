import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import ContactForm from './contact-form'

export const metadata: Metadata = generateMetadata({
  title: 'Contato - GameBoost Pro',
  description: 'Entre em contato com a GameBoost Pro. Atendimento 24/7. Email, WhatsApp e suporte técnico para dúvidas sobre nossos serviços de boost.',
  keywords: [
    'contato gameboost',
    'suporte boost',
    'atendimento boost cs2',
    'fale conosco',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/contact`,
})

export default function ContactPage() {
  return <ContactForm />
}

