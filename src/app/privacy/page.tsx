import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent} from '@/components/ui/card'

export const metadata: Metadata = generateMetadata({
  title: 'Política de Privacidade - GameBoost',
  description: 'Política de privacidade da GameBoost. Saiba como protegemos e utilizamos suas informações pessoais. Conformidade com LGPD e proteção de dados.',
  keywords: [
    'política de privacidade',
    'privacidade gameboost',
    'proteção de dados',
    'lgpd',
    'privacidade boost',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/privacy`,
})

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Política de Privacidade - GameBoost',
            description: 'Política de privacidade da GameBoost',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/privacy`,
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
              <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">POLÍTICA</span>
              <span className="text-white"> DE PRIVACIDADE</span>
            </h1>
            <p className="text-xl text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Como protegemos e utilizamos suas informações
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardContent className="p-8 space-y-8 relative z-10">
              
              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">1.</span> Informações que Coletamos
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Coletamos apenas as informações necessárias para fornecer nossos serviços:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Nome e email para comunicação</li>
                  <li>Informações de conta do jogo (apenas para o serviço contratado)</li>
                  <li>Dados de pagamento (processados por terceiros seguros)</li>
                  <li>Histórico de serviços para suporte</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">2.</span> Como Utilizamos suas Informações
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Utilizamos suas informações exclusivamente para:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Fornecer os serviços contratados</li>
                  <li>Comunicar sobre o status dos pedidos</li>
                  <li>Oferecer suporte técnico</li>
                  <li>Processar pagamentos</li>
                  <li>Melhorar nossos serviços</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">3.</span> Compartilhamento de Informações
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <strong className="text-white">Nunca compartilhamos suas informações pessoais ou credenciais de jogo com terceiros</strong>, 
                  exceto quando necessário para processar pagamentos através de provedores seguros e confiáveis. 
                  Suas credenciais de jogo são utilizadas exclusivamente para fornecer o serviço contratado.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">4.</span> Segurança dos Dados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Implementamos medidas de segurança rigorosas:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Criptografia de dados sensíveis</li>
                  <li>Acesso restrito às informações</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">5.</span> Seus Direitos
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Você tem o direito de:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir dados incorretos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Retirar o consentimento a qualquer momento</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">6.</span> Cookies e Tecnologias
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Utilizamos cookies apenas para melhorar sua experiência no site, como lembrar suas preferências 
                  e analisar o uso do site. Você pode desativar cookies nas configurações do seu navegador.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">7.</span> Alterações na Política
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Podemos atualizar esta política ocasionalmente. Notificaremos sobre mudanças significativas 
                  através do nosso site ou por email. Recomendamos revisar esta política periodicamente.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">8.</span> Contato sobre Privacidade
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Para questões sobre privacidade ou exercer seus direitos, entre em contato conosco através do 
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
