'use client'

import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mail, Clock, MapPin, Send, Loader2, CheckCircle } from 'lucide-react'
import { useState } from 'react'



export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      setIsSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      setError('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white font-orbitron mb-4">
            <span className="text-brand-purple-light">FALE</span> CONOSCO
          </h1>
          <p className="text-lg text-gray-300 font-rajdhani max-w-2xl mx-auto">
            Estamos prontos para te ajudar!
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Contact Form */}
          <Card className="bg-brand-black-light border-brand-purple/30">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white font-orbitron mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-purple-light" />
                Envie uma Mensagem
              </h2>

              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-rajdhani mb-2">
                    Mensagem Enviada!
                  </h3>
                  <p className="text-gray-400 font-rajdhani mb-4">
                    Responderemos em breve.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10"
                  >
                    Enviar outra mensagem
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-black/50 border-brand-purple/30 focus:border-brand-purple text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Seu email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-black/50 border-brand-purple/30 focus:border-brand-purple text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Assunto"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="bg-black/50 border-brand-purple/30 focus:border-brand-purple text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Sua mensagem..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={4}
                      className="bg-black/50 border-brand-purple/30 focus:border-brand-purple text-white placeholder:text-gray-500 resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm font-rajdhani">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-3 transition-all shadow-glow hover:shadow-glow-hover"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Horário de Atendimento</h4>
                <p className="text-sm text-gray-400 font-rajdhani">24 horas por dia, 7 dias por semana</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-brand-purple/5 border border-brand-purple/20">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-brand-purple-light" />
              </div>
              <div>
                <h4 className="font-bold text-white font-rajdhani">Localização</h4>
                <p className="text-sm text-gray-400 font-rajdhani">100% Online - Atendemos todo o Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

