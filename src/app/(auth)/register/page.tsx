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
import { ButtonLoading } from '@/components/common/button-loading'

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
    <div className="flex-1 bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-4 sm:p-6">
        <div className="text-center mb-3 sm:mb-5">
          <h1 className="text-xl sm:text-3xl font-bold text-white font-orbitron mb-1" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">CRIAR</span>
            <span className="text-white"> CONTA</span>
          </h1>
          <p className="text-sm text-gray-300 font-rajdhani">
            Cadastre-se para acessar nossos serviços
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 py-2">
                <AlertDescription className="text-red-300 font-rajdhani text-xs">
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
                      className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
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
                      className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
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
                        className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 pr-10 h-9"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 hover:bg-transparent h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
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
                        className="border-purple-500/50 data-[state=checked]:bg-purple-500 mt-0.5 h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="text-xs text-gray-300 font-rajdhani cursor-pointer leading-tight">
                      Aceito os{' '}
                      <Link href="/terms" className="text-purple-400 hover:text-purple-300">termos</Link>
                      {' '}e{' '}
                      <Link href="/privacy" className="text-purple-400 hover:text-purple-300">privacidade</Link>
                    </FormLabel>
                  </div>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <ButtonLoading 
              type="submit" 
              loading={isLoading}
              loadingText="Criando..."
              className="w-full bg-purple-500 text-white font-bold py-2 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani text-sm" 
            >
              CRIAR CONTA
            </ButtonLoading>

            <div className="text-center text-xs">
              <span className="text-gray-400 font-rajdhani">Já tem uma conta? </span>
              <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-rajdhani font-medium">
                Faça login
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}