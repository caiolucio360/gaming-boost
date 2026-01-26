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
    <div className="min-h-screen bg-brand-black flex items-start justify-center px-4 pt-28 pb-8">
      <div className="w-full max-w-md bg-brand-black-light/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-6">
        <div className="text-center mb-3 sm:mb-5">
          <h1 className="text-xl sm:text-3xl font-bold font-orbitron mb-1">
            <span className="text-brand-purple-light">CRIAR</span>
            <span className="text-white"> CONTA</span>
          </h1>
          <p className="text-sm text-brand-gray-300 font-rajdhani">
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
                  <FormLabel className="text-white font-rajdhani text-sm">Nome</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      className="h-9 bg-brand-black-light border-white/10 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-white placeholder:text-brand-gray-500"
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
                  <FormLabel className="text-white font-rajdhani text-sm">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="h-9 bg-brand-black-light border-white/10 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-white placeholder:text-brand-gray-500"
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
                  <FormLabel className="text-white font-rajdhani text-sm">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        className="pr-10 h-9 bg-brand-black-light border-white/10 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-white placeholder:text-brand-gray-500"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-brand-gray-500 hover:text-brand-gray-300 hover:bg-transparent h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
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
                    <FormLabel className="text-xs text-brand-gray-300 font-rajdhani cursor-pointer leading-tight">
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
                  Criando...
                </>
              ) : (
                'CRIAR CONTA'
              )}
            </button>

            <div className="text-center text-xs">
              <span className="text-brand-gray-500 font-rajdhani">Já tem uma conta? </span>
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