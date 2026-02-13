'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

const verifySchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
})

type VerifyFormData = z.infer<typeof verifySchema>

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastResend, setLastResend] = useState<number>(0)
  const [countdown, setCountdown] = useState(0)

  // Auth context integration (optional if we handle everything here, but usually Verify is standalone)
  // Actually, we need to call login after verification to properly set session
  // But verify API already returns token, so maybe we can use that?
  // Let's rely on manual login or auto-login via token handling if context supports it.
  // For now simpler approach: Verify -> Redirect to Dashboard (handling token manually or via context)

  const { login } = useAuth() // We might use this if verify endpoint doesn't auto-login

  useEffect(() => {
    if (!email) {
      router.replace('/login')
    }
  }, [email, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  })

  const handleSubmit = async (data: VerifyFormData) => {
    if (!email) return
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao verificar código')
      }

      setSuccessMessage('Conta verificada com sucesso! Redirecionando...')
      
      // Attempt to auto-login if token provided (implemented in context usually, but here verify returns token directly)
      // Since context uses NextAuth (signIn), we might need to just redirect to login page OR use the token to fake a session?
      // NextAuth usually handles session via cookies/database. The Verify endpoint returned a JWT token which is useful for API but NextAuth credentials provider needs user/pass.
      // So best flow: Verify Success -> Redirect to Login (user enters pass again) OR Auto-login via credentials if we had password (we don't).
      // Wait, Verify endpoint returns a token. 
      // If we want seamless login, we would need to pass this token to NextAuth.
      // Simplest for now: Redirect to login with success message.
      // OR: Redirect to login and user types password again.
      // Let's redirect to login for security/simplicity unless we want to hack credential provider.
      
      setTimeout(() => {
        router.push('/login?verified=true')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || countdown > 0) return
    
    // Prevent spam
    const now = Date.now()
    if (now - lastResend < 60000) {
       return
    }

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Erro ao reenviar código')
      }

      setSuccessMessage('Novo código enviado com sucesso!')
      setLastResend(now)
      setCountdown(60) // 60 seconds cooldown
      
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      setError('Erro ao reenviar código. Tente novamente.')
    }
  }

  return (
    <div className="w-full max-w-md bg-brand-black-light/30 backdrop-blur-md border border-brand-purple/50 rounded-lg p-4 sm:p-6">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-3xl font-bold font-orbitron mb-1">
          <span className="text-white">VERIFICAR</span>
          <span className="text-brand-purple-light"> CONTA</span>
        </h1>
        <p className="text-sm text-brand-gray-300 font-rajdhani">
          Digite o código de 6 dígitos enviado para <br />
          <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-brand-red/20 border-brand-red/50 py-2">
              <AlertDescription className="text-brand-red font-rajdhani text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-green-500/20 border-green-500/50 py-2">
              <AlertDescription className="text-green-500 font-rajdhani text-xs">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-white font-rajdhani text-sm">Código de Verificação</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="h-12 text-center text-lg tracking-[0.5em] font-bold bg-brand-black-light border-white/10 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple text-white placeholder:text-brand-gray-500"
                    {...field}
                    onChange={(e) => {
                       // Allow only numbers
                       const value = e.target.value.replace(/[^0-9]/g, '')
                       field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormMessage className="text-brand-red text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-3 rounded-lg transition-all shadow-glow hover:shadow-glow-hover font-rajdhani"
          >
            {isLoading ? 'Verificando...' : 'VERIFICAR'}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-sm font-rajdhani text-brand-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Reenviar código em ${countdown}s` : 'Não recebeu? Reenviar código'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-xs font-rajdhani text-brand-purple hover:text-brand-purple-light transition-colors">
              Voltar para Login
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-brand-black flex items-start justify-center px-4 pt-28 pb-8">
      <Suspense fallback={<div className="text-white">Carregando...</div>}>
         <VerifyContent />
      </Suspense>
    </div>
  )
}
