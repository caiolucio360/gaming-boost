'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api-client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/common/loading-spinner'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Token de redefinição não encontrado')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const handleSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Token de redefinição não encontrado')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await api.post('/api/auth/reset-password', { token, password: data.password }, { requireAuth: false })

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/login')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token && !error) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-28 pb-8">
        <Card className="w-full max-w-md bg-card/30 backdrop-blur-md border-brand-purple/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-brand-purple animate-spin" />
            </div>
            <CardTitle className="text-xl text-foreground font-orbitron">
              Carregando…
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-28 pb-8">
        <Card className="w-full max-w-md bg-card/30 backdrop-blur-md border-emerald-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle className="text-xl text-foreground font-orbitron">
              Senha Redefinida!
            </CardTitle>
            <CardDescription className="text-muted-foreground font-rajdhani">
              Sua senha foi alterada com sucesso. Você será redirecionado para o login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full border-brand-purple/50 text-foreground hover:bg-brand-purple/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-28 pb-8">
        <Card className="w-full max-w-md bg-card/30 backdrop-blur-md border-brand-red/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-red/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-brand-red" />
            </div>
            <CardTitle className="text-xl text-foreground font-orbitron">
              Link Inválido
            </CardTitle>
            <CardDescription className="text-muted-foreground font-rajdhani">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full border-brand-purple/50 text-foreground hover:bg-brand-purple/20">
                Solicitar Novo Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-28 pb-8">
      <div className="w-full max-w-md bg-card/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center">
            <Lock className="h-6 w-6 text-brand-purple" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground font-orbitron mb-1 sm:mb-2">
            Nova Senha
          </h1>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Digite sua nova senha abaixo
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-brand-red/20 border-brand-red/50">
            <AlertCircle className="h-4 w-4 text-brand-red" />
            <AlertDescription className="text-brand-red">{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-rajdhani text-sm">Nova Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="h-10 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-brand-red text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-rajdhani text-sm">Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="h-10 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-brand-red text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full font-bold font-rajdhani"
            >
              {isLoading ? (
                <>
                  <Spinner size="md" />
                  Redefinindo…
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
