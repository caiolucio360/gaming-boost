import { generateMetadata } from '@/lib/seo'
import type { Metadata} from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = generateMetadata({
  title: 'Termos de Uso - GameBoost',
  description: 'Termos e condições de uso da GameBoost. Conheça nossas políticas de uso, responsabilidades e condições para utilização dos serviços de boost.',
  keywords: [
    'termos de uso',
    'termos e condições',
    'condições de uso gameboost',
    'política de uso',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/terms`,
})

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Termos de Uso - GameBoost',
            description: 'Termos e condições de uso da GameBoost',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/terms`,
            inLanguage: 'pt-BR',
            isPartOf: {
              '@type': 'WebSite',
              name: 'GameBoost',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br',
            },
          }),
        }}
      />
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
              <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">TERMOS</span>
              <span className="text-white"> DE USO</span>
            </h1>
            <p className="text-xl text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Conheça nossos termos e condições de uso
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardContent className="p-8 space-y-8 relative z-10">
              
              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">1.</span> Aceitação dos Termos
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Ao utilizar os serviços da GameBoost, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">2.</span> Descrição dos Serviços
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  A GameBoost oferece serviços de boost para jogos competitivos, incluindo:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Boost de rank em Counter-Strike 2</li>
                  <li>Serviços de coaching (em breve)</li>
                  <li>Suporte 24/7</li>
                  <li>Garantia de segurança da conta</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">3.</span> Responsabilidades do Usuário
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Você é responsável por:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Fornecer informações precisas e atualizadas</li>
                  <li>Manter a segurança de sua conta</li>
                  <li>Não compartilhar credenciais de acesso</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">4.</span> Privacidade e Segurança
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Respeitamos sua privacidade e implementamos medidas de segurança para proteger suas informações. 
                  Nunca compartilhamos suas credenciais de jogo com terceiros e utilizamos apenas informações 
                  necessárias para fornecer nossos serviços.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">5.</span> Modificações dos Termos
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão 
                  em vigor imediatamente após a publicação. É sua responsabilidade revisar periodicamente 
                  estes termos.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">6.</span> Contato
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Para dúvidas sobre estes termos, entre em contato conosco através do nosso 
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"> formulário de contato</Link>.
                </p>
              </section>

              <div className="border-t border-purple-500/30 pt-8 mt-8">
                <p className="text-sm text-gray-400 font-rajdhani text-center" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Última atualização: Dezembro de 2025
                </p>
              </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
