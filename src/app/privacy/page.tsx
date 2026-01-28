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
  canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br') + '/privacy',
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
            url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br') + '/privacy',
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
              <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">POLÍTICA</span>
              <span className="text-white"> DE PRIVACIDADE</span>
            </h1>
            <p className="text-xl text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Como protegemos e utilizamos suas informações
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardContent className="p-8 space-y-8 relative z-10">

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">1.</span> Introdução e Compromisso com a LGPD
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  A GameBoost respeita sua privacidade e está comprometida com a proteção de seus dados pessoais em conformidade
                  com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
                </p>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">2.</span> Dados Pessoais Coletados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Coletamos as seguintes categorias de dados pessoais:
                </p>
                <div className="space-y-4">
                  <div className="ml-4">
                    <h3 className="text-white font-rajdhani font-semibold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>2.1 Dados de Cadastro:</h3>
                    <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      <li>Nome completo</li>
                      <li>Endereço de e-mail</li>
                      <li>Senha (armazenada com hash bcrypt)</li>
                      <li>Tipo de usuário (Cliente, Booster ou Admin)</li>
                    </ul>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-white font-rajdhani font-semibold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>2.2 Dados de Pagamento:</h3>
                    <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      <li>CPF/CNPJ (apenas para processar pagamentos)</li>
                      <li>Número de telefone (para transações PIX)</li>
                      <li>Chave PIX (para boosters/admins receberem pagamentos)</li>
                      <li>Histórico de transações</li>
                    </ul>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-white font-rajdhani font-semibold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>2.3 Dados de Serviço:</h3>
                    <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      <li>Credenciais de jogos (criptografadas com AES-256-GCM)</li>
                      <li>Perfil Steam (URL pública e Steam ID)</li>
                      <li>Histórico de pedidos e serviços</li>
                      <li>Comunicações e mensagens na plataforma</li>
                    </ul>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-white font-rajdhani font-semibold mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>2.4 Dados de Navegação:</h3>
                    <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      <li>Endereço IP</li>
                      <li>Tipo de navegador e dispositivo</li>
                      <li>Páginas visitadas e tempo de navegação</li>
                      <li>Cookies de sessão e preferências</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">3.</span> Finalidade do Tratamento de Dados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Utilizamos seus dados pessoais exclusivamente para as seguintes finalidades:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Execução de Contrato:</strong> Fornecer os serviços de boost contratados</li>
                  <li><strong className="text-white">Processamento de Pagamentos:</strong> Processar transações via PIX através da AbacatePay</li>
                  <li><strong className="text-white">Comunicação:</strong> Enviar notificações sobre status de pedidos, pagamentos e atualizações</li>
                  <li><strong className="text-white">Suporte:</strong> Oferecer assistência técnica e resolver problemas</li>
                  <li><strong className="text-white">Segurança:</strong> Prevenir fraudes, abusos e proteger a plataforma (rate limiting, logs)</li>
                  <li><strong className="text-white">Melhorias:</strong> Analisar uso da plataforma para aprimorar serviços</li>
                  <li><strong className="text-white">Cumprimento Legal:</strong> Atender obrigações legais e regulatórias</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">4.</span> Base Legal para Tratamento
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Conforme a LGPD, tratamos seus dados pessoais com base nas seguintes hipóteses legais:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Consentimento:</strong> Você consente ao criar conta e utilizar nossos serviços</li>
                  <li><strong className="text-white">Execução de Contrato:</strong> Necessário para executar o contrato de serviço</li>
                  <li><strong className="text-white">Legítimo Interesse:</strong> Segurança da plataforma e prevenção de fraudes</li>
                  <li><strong className="text-white">Obrigação Legal:</strong> Cumprimento de obrigações fiscais e regulatórias</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">5.</span> Compartilhamento de Dados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <strong className="text-white">Nunca vendemos ou alugamos seus dados pessoais.</strong> Compartilhamos dados apenas quando estritamente necessário:
                </p>
                <div className="space-y-3 text-gray-300 font-rajdhani ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <p><strong className="text-white">5.1 Processadores de Pagamento:</strong> AbacatePay para processar transações PIX (CPF, telefone, valor)</p>
                  <p><strong className="text-white">5.2 Serviço de Email:</strong> Resend para enviar notificações transacionais (email, nome)</p>
                  <p><strong className="text-white">5.3 Boosters Designados:</strong> Credenciais de jogo (criptografadas) compartilhadas apenas com o booster atribuído ao seu pedido</p>
                  <p><strong className="text-white">5.4 Autoridades:</strong> Quando exigido por lei ou ordem judicial</p>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">6.</span> Segurança e Proteção de Dados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Implementamos medidas técnicas e organizacionais rigorosas para proteger seus dados:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Criptografia AES-256-GCM:</strong> Credenciais de jogo são armazenadas com criptografia de nível militar</li>
                  <li><strong className="text-white">Hash Bcrypt:</strong> Senhas nunca são armazenadas em texto claro</li>
                  <li><strong className="text-white">HTTPS/TLS:</strong> Todas as comunicações são criptografadas em trânsito</li>
                  <li><strong className="text-white">Rate Limiting:</strong> Proteção contra ataques de força bruta e DDoS</li>
                  <li><strong className="text-white">Controle de Acesso:</strong> Acesso restrito aos dados baseado em função (RBAC)</li>
                  <li><strong className="text-white">Autenticação JWT:</strong> Tokens seguros para sessões de usuário</li>
                  <li><strong className="text-white">Logs de Auditoria:</strong> Monitoramento de atividades suspeitas</li>
                  <li><strong className="text-white">Backups Regulares:</strong> Proteção contra perda de dados</li>
                </ul>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">7.</span> Seus Direitos (LGPD)
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  De acordo com a LGPD, você possui os seguintes direitos sobre seus dados pessoais:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Acesso:</strong> Confirmar que tratamos seus dados e solicitar cópia</li>
                  <li><strong className="text-white">Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
                  <li><strong className="text-white">Anonimização, Bloqueio ou Eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade</li>
                  <li><strong className="text-white">Portabilidade:</strong> Receber seus dados em formato estruturado e interoperável</li>
                  <li><strong className="text-white">Exclusão:</strong> Solicitar eliminação de dados tratados com base em consentimento</li>
                  <li><strong className="text-white">Revogação do Consentimento:</strong> Retirar consentimento a qualquer momento</li>
                  <li><strong className="text-white">Oposição:</strong> Opor-se ao tratamento realizado com base em legítimo interesse</li>
                  <li><strong className="text-white">Informação:</strong> Sobre entidades públicas e privadas com as quais compartilhamos dados</li>
                </ul>
                <p className="text-gray-300 font-rajdhani leading-relaxed mt-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Para exercer seus direitos, entre em contato através do nosso{' '}
                  <Link href="/contact" className="text-brand-purple-light hover:text-brand-purple-light transition-colors font-semibold">formulário de contato</Link>.
                  Responderemos sua solicitação em até 15 dias.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">8.</span> Retenção de Dados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Dados de Conta:</strong> Enquanto sua conta estiver ativa ou conforme necessário para fornecer serviços</li>
                  <li><strong className="text-white">Dados Financeiros:</strong> 5 anos conforme legislação fiscal brasileira</li>
                  <li><strong className="text-white">Credenciais de Jogo:</strong> Excluídas imediatamente após conclusão do serviço</li>
                  <li><strong className="text-white">Logs de Segurança:</strong> Até 6 meses para fins de auditoria e segurança</li>
                </ul>
                <p className="text-gray-300 font-rajdhani leading-relaxed mt-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Após esses períodos, seus dados serão excluídos ou anonimizados de forma segura.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">9.</span> Cookies e Tecnologias Similares
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed mb-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Utilizamos cookies e tecnologias similares para:
                </p>
                <ul className="list-disc list-inside text-gray-300 font-rajdhani space-y-2 ml-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <li><strong className="text-white">Essenciais:</strong> Manter sua sessão ativa e autenticação (JWT)</li>
                  <li><strong className="text-white">Funcionais:</strong> Lembrar suas preferências e configurações</li>
                  <li><strong className="text-white">Segurança:</strong> Detectar atividades fraudulentas e proteger contra ataques</li>
                </ul>
                <p className="text-gray-300 font-rajdhani leading-relaxed mt-4 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Você pode gerenciar cookies através das configurações do seu navegador, mas isso pode afetar a funcionalidade da plataforma.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">10.</span> Transferência Internacional de Dados
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Nossos servidores e parceiros podem estar localizados fora do Brasil. Quando houver transferência internacional
                  de dados, garantimos que sejam adotadas medidas de segurança adequadas e que o país de destino ou o destinatário
                  ofereça grau de proteção de dados pessoais adequado, conforme exigido pela LGPD.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">11.</span> Privacidade de Menores
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Nossos serviços são destinados a pessoas com 18 anos ou mais. Não coletamos intencionalmente dados de menores
                  de 18 anos. Se você acredita que coletamos inadvertidamente dados de um menor, entre em contato imediatamente
                  para que possamos tomar as medidas apropriadas.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">12.</span> Alterações nesta Política
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Podemos atualizar esta Política de Privacidade ocasionalmente para refletir mudanças em nossas práticas ou
                  na legislação. Alterações significativas serão notificadas através do nosso site ou por e-mail. A data da
                  última atualização está indicada no final desta página. Recomendamos revisar periodicamente esta política.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">13.</span> Incidentes de Segurança
                </h2>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares de dados,
                  comunicaremos os afetados e a Autoridade Nacional de Proteção de Dados (ANPD) em conformidade com a LGPD,
                  informando sobre a natureza do incidente, os dados afetados e as medidas tomadas.
                </p>
              </section>

              <section className="p-4 rounded-lg bg-black/20 hover:bg-black/30 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-white font-orbitron mb-4 group-hover:text-brand-purple-lighter transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">14.</span> Contato e Encarregado de Dados (DPO)
                </h2>
                <div className="text-gray-300 font-rajdhani leading-relaxed space-y-3 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  <p>
                    Para questões sobre privacidade, exercer seus direitos ou reportar preocupações relacionadas a dados pessoais,
                    entre em contato com nosso Encarregado de Proteção de Dados:
                  </p>
                  <p>
                    <strong className="text-white">Formulário de Contato:</strong>{' '}
                    <Link href="/contact" className="text-brand-purple-light hover:text-brand-purple-light transition-colors font-semibold">
                      Clique aqui
                    </Link>
                  </p>
                  <p className="text-sm">
                    Prazo de resposta: até 15 dias conforme estabelecido pela LGPD
                  </p>
                </div>
              </section>

              <div className="border-t border-brand-purple/30 pt-8 mt-8">
                <p className="text-sm text-gray-400 font-rajdhani text-center" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Última atualização: Janeiro de 2026
                </p>
                <p className="text-xs text-gray-500 font-rajdhani text-center mt-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
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
