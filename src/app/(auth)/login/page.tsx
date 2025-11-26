'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { ButtonLoading } from '@/components/common/button-loading'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

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
      // O AuthContext já faz o redirecionamento, não precisa fazer aqui
      await login(data.email, data.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-32 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">ENTRAR</span>
            <span className="text-white"> NA CONTA</span>
          </h1>
          <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Entre na sua conta para acessar nossos serviços
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                <AlertDescription className="text-red-300 font-rajdhani">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

          <div className="flex items-center justify-between">
            <Link 
              href="/forgot-password" 
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-rajdhani"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}
            >
              Esqueceu a senha?
            </Link>
          </div>

          <ButtonLoading 
            type="submit" 
            loading={isLoading}
            loadingText="Entrando..."
            className="w-full bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani" 
            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
          >
            ENTRAR
          </ButtonLoading>

            <div className="text-center text-sm">
              <span className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>Não tem uma conta? </span>
              <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                Cadastre-se
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
