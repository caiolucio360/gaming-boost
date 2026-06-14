'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/auth-context'
import { Spinner } from '@/components/common/loading-spinner'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  terms: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register } = useAuth()
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      terms: false,
    },
  })

  const handleSubmit = async (data: RegisterFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await register(data.name, data.email, data.password)
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-28 pb-8">
      <div className="w-full max-w-md bg-card/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-6">
        <div className="text-center mb-3 sm:mb-5">
          <h1 className="text-xl sm:text-3xl font-bold font-orbitron mb-1">
            <span className="text-brand-purple-light">CRIAR</span>
            <span className="text-foreground"> CONTA</span>
          </h1>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Cadastre-se para acessar nossos serviços
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            {error && (
              <Alert variant="destructive" className="bg-brand-red/20 border-brand-red/50 py-2">
                <AlertDescription className="text-brand-red font-rajdhani text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-foreground font-rajdhani text-sm">Nome</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome"
                      className="h-9 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-brand-red text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-foreground font-rajdhani text-sm">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="seu@email.com"
                      className="h-9 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
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
                <FormItem className="space-y-1">
                  <FormLabel className="text-foreground font-rajdhani text-sm">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Sua senha"
                        className="pr-10 h-9 bg-card border-border focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-foreground placeholder:text-muted-foreground"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showPassword}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-brand-red text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-brand-purple/50 data-[state=checked]:bg-brand-purple mt-0.5 h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="text-xs text-muted-foreground font-rajdhani cursor-pointer leading-tight">
                      Aceito os{' '}
                      <Link href="/terms" className="text-brand-purple hover:text-brand-purple-light">termos</Link>
                      {' '}e{' '}
                      <Link href="/privacy" className="text-brand-purple hover:text-brand-purple-light">privacidade</Link>
                    </FormLabel>
                  </div>
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
                  Criando…
                </>
              ) : (
                'CRIAR CONTA'
              )}
            </Button>

            <div className="text-center text-xs">
              <span className="text-muted-foreground font-rajdhani">Já tem uma conta? </span>
              <Link href="/login" className="text-brand-purple hover:text-brand-purple-light transition-colors font-rajdhani font-medium">
                Faça login
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}