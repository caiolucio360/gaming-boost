'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginContent() {
  const router = useRouter()
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-brand-black-light/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-8">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold font-orbitron mb-1 sm:mb-2">
          <span className="text-brand-purple-light">ENTRAR</span>
          <span className="text-white"> NA CONTA</span>
        </h1>
        <p className="text-sm text-brand-gray-300 font-rajdhani">
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-rajdhani text-sm">
                  Senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      className="pr-10 h-10 bg-brand-black-light border-white/10 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-white placeholder:text-brand-gray-500"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-brand-gray-500 hover:text-brand-gray-300 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
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
                Entrando...
              </>
            ) : (
              'ENTRAR'
            )}
          </button>

          <div className="text-center text-xs">
            <span className="text-brand-gray-500 font-rajdhani">Não tem uma conta? </span>
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
    <div className="min-h-screen bg-brand-black flex items-start justify-center px-4 pt-28 pb-8">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
         <LoginContent />
      </Suspense>
    </div>
  )
}
