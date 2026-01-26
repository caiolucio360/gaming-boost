'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao processar solicitação')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 pt-20 pb-8">
        <Card className="w-full max-w-md bg-brand-black-light/30 backdrop-blur-md border-emerald-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle className="text-xl text-white font-orbitron">
              Email Enviado!
            </CardTitle>
            <CardDescription className="text-brand-gray-500 font-rajdhani">
              Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <button className="w-full bg-transparent border border-brand-purple/50 hover:bg-brand-purple/20 text-white font-bold py-3 px-6 rounded-lg transition-all font-rajdhani flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Login
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-start justify-center px-4 pt-28 pb-8">
      <div className="w-full max-w-md bg-brand-black-light/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center">
            <Mail className="h-6 w-6 text-brand-purple" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-orbitron mb-1 sm:mb-2">
            Recuperar Senha
          </h1>
          <p className="text-sm text-brand-gray-300 font-rajdhani">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-brand-red/20 border-brand-red/50">
                <AlertDescription className="text-brand-red font-rajdhani text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-rajdhani text-sm">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="h-10 bg-brand-black-light border-white/10 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-white placeholder:text-brand-gray-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-brand-red text-xs" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-3 px-6 rounded-lg transition-all
                shadow-glow hover:shadow-glow-hover
                disabled:opacity-50 disabled:cursor-not-allowed font-rajdhani flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar Instruções'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-brand-purple hover:text-brand-purple-light transition-colors font-rajdhani inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Login
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
