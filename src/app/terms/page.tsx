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
  canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br') + '/terms',
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
            url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br') + '/terms',
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
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardContent className="p-8 space-y-8 relative z-10">

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">1.</span> Aceitação dos Termos
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Ao acessar e utilizar a plataforma GameBoost, você concorda em cumprir e estar vinculado a estes Termos de Uso.
                  Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços. O uso continuado da
                  plataforma constitui aceitação de quaisquer modificações futuras destes termos.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">2.</span> Definições
                </h2>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Cliente:</strong> Usuário que contrata serviços de boost</li>
                  <li><strong className="text-white">Booster:</strong> Profissional que executa os serviços de boost</li>
                  <li><strong className="text-white">Plataforma:</strong> Sistema GameBoost e todos os seus componentes</li>
                  <li><strong className="text-white">Serviço:</strong> Qualquer serviço de boost oferecido pela plataforma</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">3.</span> Descrição dos Serviços
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  A GameBoost é uma plataforma que conecta jogadores a profissionais qualificados para serviços de boost em jogos competitivos:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Boost de rank em Counter-Strike 2 (Premier e Gamers Club)</li>
                  <li>Sistema de pagamento via PIX</li>
                  <li>Suporte ao cliente</li>
                  <li>Sistema de disputa e mediação</li>
                  <li>Garantia de segurança da conta (criptografia AES-256)</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">4.</span> Cadastro e Conta de Usuário
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Para utilizar nossos serviços, você deve:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Ter pelo menos 18 anos de idade</li>
                  <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
                  <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">5.</span> Pagamentos e Reembolsos
                </h2>
                <div className="space-y-3 text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <p><strong className="text-white">5.1 Pagamentos:</strong> Todos os pagamentos são processados via PIX através da AbacatePay. Os preços são dinâmicos e configuráveis pela administração.</p>
                  <p><strong className="text-white">5.2 Reembolsos Automáticos:</strong> Pedidos não aceitos por boosters dentro do prazo configurado (padrão: 24 horas) serão automaticamente reembolsados.</p>
                  <p><strong className="text-white">5.3 Reembolsos Manuais:</strong> Reembolsos podem ser solicitados em casos de não cumprimento do serviço, mediante análise da administração.</p>
                  <p><strong className="text-white">5.4 Prazo de Reembolso:</strong> Reembolsos aprovados são processados em até 5 dias úteis.</p>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">6.</span> Responsabilidades do Cliente
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  O cliente é responsável por:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Fornecer credenciais de jogo corretas e funcionais</li>
                  <li>Não acessar a conta durante o serviço de boost</li>
                  <li>Não alterar a senha ou configurações de segurança durante o serviço</li>
                  <li>Manter comunicação respeitosa com boosters e administração</li>
                  <li>Não solicitar serviços que violem os termos dos jogos</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">7.</span> Responsabilidades do Booster
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  O booster é responsável por:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Executar o serviço conforme acordado</li>
                  <li>Manter confidencialidade das credenciais do cliente</li>
                  <li>Não utilizar cheats, hacks ou qualquer software proibido</li>
                  <li>Comunicar progresso e eventuais problemas</li>
                  <li>Receber comissões apenas após conclusão aprovada do serviço</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">8.</span> Sistema de Comissões
                </h2>
                <div className="space-y-3 text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <p>As comissões são calculadas e distribuídas da seguinte forma:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Percentuais são definidos pela administração e podem ser personalizados por booster</li>
                    <li>Comissões ficam pendentes até conclusão do pedido</li>
                    <li>Pagamentos de comissões são processados após aprovação administrativa</li>
                    <li>Saques mínimos: R$ 3,50</li>
                  </ul>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">9.</span> Disputas e Mediação
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Em caso de conflitos entre cliente e booster, a plataforma oferece um sistema de disputa onde a administração
                  atua como mediadora. As decisões administrativas são finais e vinculantes. Ambas as partes comprometem-se a
                  fornecer evidências e cooperar durante o processo de mediação.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">10.</span> Privacidade e Segurança
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  A proteção de seus dados é nossa prioridade:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Credenciais de jogo são criptografadas com AES-256-GCM</li>
                  <li>Nunca compartilhamos informações com terceiros não autorizados</li>
                  <li>Conforme LGPD (Lei Geral de Proteção de Dados)</li>
                  <li>Veja nossa <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">Política de Privacidade</Link> completa</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">11.</span> Limitação de Responsabilidade
                </h2>
                <div className="space-y-3 text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <p>A GameBoost não se responsabiliza por:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Suspensões ou banimentos aplicados pelas desenvolvedoras dos jogos</li>
                    <li>Problemas técnicos fora de nosso controle</li>
                    <li>Perda de progresso devido a ações das desenvolvedoras</li>
                    <li>Interrupções de serviço para manutenção programada</li>
                  </ul>
                  <p className="mt-3">A plataforma atua como intermediária entre clientes e boosters e não se responsabiliza por ações
                  individuais dos usuários que violem os termos dos jogos.</p>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">12.</span> Proibições e Conduta
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  É estritamente proibido:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li>Utilizar a plataforma para fraudes ou atividades ilícitas</li>
                  <li>Compartilhar contas ou credenciais da plataforma</li>
                  <li>Tentar burlar sistemas de segurança ou rate limiting</li>
                  <li>Assediar, ameaçar ou desrespeitar outros usuários</li>
                  <li>Criar múltiplas contas para abusar de promoções</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">13.</span> Suspensão e Encerramento
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio e sem
                  reembolso de serviços já pagos. Você pode solicitar o encerramento de sua conta a qualquer momento através
                  do suporte, respeitando pedidos em andamento.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">14.</span> Modificações dos Termos
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão
                  notificadas por email ou através da plataforma. O uso continuado após modificações constitui aceitação
                  dos novos termos. Recomendamos revisar periodicamente esta página.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">15.</span> Lei Aplicável
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas serão resolvidas
                  no foro da comarca do domicílio do consumidor, conforme previsto no Código de Defesa do Consumidor.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">16.</span> Contato
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Para dúvidas, sugestões ou questões sobre estes termos, entre em contato conosco através do{' '}
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">formulário de contato</Link>.
                </p>
              </section>

              <div className="border-t border-purple-500/30 pt-8 mt-8">
                <p className="text-sm text-gray-400 font-rajdhani text-center" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Última atualização: Janeiro de 2026
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
