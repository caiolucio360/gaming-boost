'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { ButtonLoading } from '@/components/common/button-loading'

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
      <div className="flex-1 bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/30 backdrop-blur-md border-green-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <CardTitle className="text-xl text-white font-orbitron">
              Email Enviado!
            </CardTitle>
            <CardDescription className="text-gray-400 font-rajdhani">
              Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-4 sm:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Mail className="h-6 w-6 text-purple-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-orbitron mb-1 sm:mb-2">
            Recuperar Senha
          </h1>
          <p className="text-sm text-gray-300 font-rajdhani">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                <AlertDescription className="text-red-300 font-rajdhani text-sm">
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
                      className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400 h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <ButtonLoading 
              type="submit" 
              loading={isLoading}
              loadingText="Enviando..."
              className="w-full bg-purple-500 text-white font-bold py-2.5 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani text-sm" 
            >
              Enviar Instruções
            </ButtonLoading>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-rajdhani inline-flex items-center gap-1"
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
