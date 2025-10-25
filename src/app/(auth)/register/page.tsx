'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simular registro
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
    // Redirect após registro bem-sucedido
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-32 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">CRIAR</span>
            <span className="text-white"> CONTA</span>
          </h1>
          <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Cadastre-se para acessar nossos serviços
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              required
              className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                required
                className="bg-black/50 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required className="border-purple-500/50 data-[state=checked]:bg-purple-500" />
            <Label htmlFor="terms" className="text-sm text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
              Aceito os{' '}
              <Link href="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
                termos de uso
              </Link>
              {' '}e{' '}
              <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
                política de privacidade
              </Link>
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 font-rajdhani" 
            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'CRIAR CONTA'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>Já tem uma conta? </span>
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}