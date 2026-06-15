'use client'

import { Text } from '@/components/common/typography'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Reveal } from '@/components/home/reveal'
import { SectionHeading } from '@/components/home/section-heading'

const FAQS = [
  {
    q: 'Minha conta fica segura durante o boost?',
    a: 'Sim. As credenciais da Steam são armazenadas com criptografia AES-256-GCM, os boosters são verificados e o gameplay é 100% limpo, sem cheats. Sua conta nunca corre risco de banimento.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'O pagamento é via PIX, instantâneo e seguro. Assim que confirmado, seu pedido entra na fila e um booster é designado.',
  },
  {
    q: 'Quanto tempo leva para concluir?',
    a: 'Depende do serviço e da faixa de rating escolhida. Você acompanha o progresso em tempo real pelo painel e pode falar com o booster pelo chat a qualquer momento.',
  },
  {
    q: 'Preciso passar minha senha?',
    a: 'Apenas no Boost tradicional, em que o booster joga na sua conta — e a senha fica criptografada. No Duo Boost e no Coaching você joga na sua própria conta e não compartilha credenciais.',
  },
  {
    q: 'Posso acompanhar o andamento do pedido?',
    a: 'Sim. No painel você vê cada partida, o status do pedido e conversa diretamente com o booster responsável.',
  },
  {
    q: 'E se algo der errado?',
    a: 'Nosso suporte está disponível para ajudar e, dentro das nossas políticas, pedidos não atendidos no prazo são reembolsados automaticamente.',
  },
] as const

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-muted/30 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Tira-dúvidas"
          title="Perguntas frequentes"
          subtitle="O que todo mundo pergunta antes de contratar."
          titleId="faq-title"
        />

        <Reveal className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border bg-card px-5 transition-colors duration-200 hover:border-brand-purple/40 data-[state=open]:border-brand-purple/50"
              >
                <AccordionTrigger className="text-left font-orbitron text-base hover:no-underline [&[data-state=open]>svg]:text-brand-purple-light">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <Text className="text-sm leading-relaxed md:text-base">{faq.a}</Text>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
