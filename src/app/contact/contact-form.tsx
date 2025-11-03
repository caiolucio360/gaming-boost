'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MailIcon, PhoneIcon, ClockIcon } from 'lucide-react'

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
            <span className="text-purple-300">ENTRE</span>
            <span className="text-white"> EM CONTATO</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Estamos aqui para ajudar você a alcançar seus objetivos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          
          {/* Formulário de Contato */}
          <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white font-orbitron mb-6" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
              <span className="text-purple-300">ENVIE</span>
              <span className="text-white"> UMA MENSAGEM</span>
            </h2>
            
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

              <Button 
                type="submit" 
                className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 font-rajdhani" 
                style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'ENVIAR MENSAGEM'}
              </Button>
            </form>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-8">
            
            {/* Informações Gerais */}
            <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white font-orbitron mb-6" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                <span className="text-purple-300">INFORMAÇÕES</span>
                <span className="text-white"> DE CONTATO</span>
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                    <MailIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      Email
                    </h3>
                    <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      contato@gameboost.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                    <PhoneIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      WhatsApp
                    </h3>
                    <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      +55 (11) 99999-9999
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                    <ClockIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      Horário de Atendimento
                    </h3>
                    <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      24/7 - Suporte contínuo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Rápido */}
            <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white font-orbitron mb-6" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                <span className="text-purple-300">PERGUNTAS</span>
                <span className="text-white"> FREQUENTES</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-bold font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Quanto tempo leva o boost?
                  </h3>
                  <p className="text-gray-300 font-rajdhani text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    O tempo varia conforme a diferença de rank.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-bold font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    É seguro para minha conta?
                  </h3>
                  <p className="text-gray-300 font-rajdhani text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    Sim, utilizamos métodos seguros e nunca compartilhamos suas credenciais.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-bold font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Posso acompanhar o progresso?
                  </h3>
                  <p className="text-gray-300 font-rajdhani text-sm" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    Sim, fornecemos atualizações regulares sobre o progresso do seu boost.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

