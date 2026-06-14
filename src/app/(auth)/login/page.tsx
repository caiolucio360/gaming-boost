'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Spinner, LoadingSpinner } from '@/components/common/loading-spinner'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginContent() {
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified')
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    if (verified) {
      setSuccess('Conta verificada com sucesso! Faça login para continuar.')
    }
  }, [verified])

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data.email, data.password)
      // Keep loading active — redirect will unmount this component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-card/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-8">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold font-orbitron mb-1 sm:mb-2">
          <span className="text-brand-purple-light">ENTRAR</span>
          <span className="text-foreground"> NA CONTA</span>
        </h1>
        <p className="text-sm text-muted-foreground font-rajdhani">
          Entre na sua conta para acessar nossos serviços
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {success && (
            <Alert className="bg-green-500/20 border-green-500/50">
              <AlertDescription className="text-green-500 font-rajdhani text-sm">
                {success}
              </AlertDescription>
            </Alert>
          )}
          
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
                <FormLabel className="text-foreground font-rajdhani text-sm">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="seu@email.com"
                    className="h-10 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-brand-red text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-rajdhani text-sm">
                  Senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Sua senha"
                      className="pr-10 h-10 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" aria-hidden="true" /> : <EyeIcon className="h-4 w-4" aria-hidden="true" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className="text-brand-red text-xs" />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-brand-purple hover:text-brand-purple-light transition-colors font-rajdhani"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full font-bold font-rajdhani"
          >
            {isLoading ? (
              <>
                <Spinner size="md" />
                Entrando…
              </>
            ) : (
              'ENTRAR'
            )}
          </Button>

          <div className="text-center text-xs">
            <span className="text-muted-foreground font-rajdhani">Não tem uma conta? </span>
            <Link href="/register" className="text-brand-purple hover:text-brand-purple-light transition-colors font-rajdhani font-medium">
              Cadastre-se
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-28 pb-8">
      <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
         <LoginContent />
      </Suspense>
    </div>
  )
}
