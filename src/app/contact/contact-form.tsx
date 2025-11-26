'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MailIcon, PhoneIcon, ClockIcon } from 'lucide-react'
import { ButtonLoading } from '@/components/common/button-loading'

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    // Aqui você adicionaria a lógica de envio do formulário
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">ENTRE</span>
            <span className="text-white"> EM CONTATO</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Estamos aqui para ajudar você a alcançar seus objetivos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl xl:max-w-7xl mx-auto">
          
          {/* Formulário de Contato */}
          <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
            {/* Efeito de brilho sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold text-white font-orbitron group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">ENVIE</span>
                <span className="text-white"> UMA MENSAGEM</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      required
                      className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Assunto
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Assunto da sua mensagem"
                    required
                    className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-white font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Mensagem
                  </Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Digite sua mensagem aqui..."
                    required
                    className="w-full bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                <ButtonLoading 
                  type="submit" 
                  loading={isLoading}
                  loadingText="Enviando..."
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani" 
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                >
                  ENVIAR MENSAGEM
                </ButtonLoading>
              </form>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <div className="space-y-8">
            
            {/* Informações Gerais */}
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold text-white font-orbitron group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">INFORMAÇÕES</span>
                  <span className="text-white"> DE CONTATO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex-shrink-0 shadow-lg transition-all duration-300">
                      <MailIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold font-rajdhani mb-1 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                        Email
                      </h3>
                      <p className="text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                        contato@gameboost.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex-shrink-0 shadow-lg transition-all duration-300">
                      <PhoneIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold font-rajdhani mb-1 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                        WhatsApp
                      </h3>
                      <p className="text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                        +55 (11) 99999-9999
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex-shrink-0 shadow-lg transition-all duration-300">
                      <ClockIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold font-rajdhani mb-1 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                        Horário de Atendimento
                      </h3>
                      <p className="text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                        24/7 - Suporte contínuo
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Rápido */}
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl font-bold text-white font-orbitron group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">PERGUNTAS</span>
                  <span className="text-white"> FREQUENTES</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors duration-300">
                    <h3 className="text-white font-bold font-rajdhani mb-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      Quanto tempo leva o boost?
                    </h3>
                    <p className="text-gray-300 font-rajdhani text-sm group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      O tempo varia conforme a diferença de rank.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors duration-300">
                    <h3 className="text-white font-bold font-rajdhani mb-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      É seguro para minha conta?
                    </h3>
                    <p className="text-gray-300 font-rajdhani text-sm group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      Sim, utilizamos métodos seguros e nunca compartilhamos suas credenciais.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors duration-300">
                    <h3 className="text-white font-bold font-rajdhani mb-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      Posso acompanhar o progresso?
                    </h3>
                    <p className="text-gray-300 font-rajdhani text-sm group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      Sim, fornecemos atualizações regulares sobre o progresso do seu boost.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

