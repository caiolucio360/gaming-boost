'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  ShieldIcon, 
  UserIcon, 
  LogOutIcon, 
  SettingsIcon,
  MenuIcon,
  XIcon
} from 'lucide-react'
import { useState } from 'react'

export function ElojobHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { name: 'Início', href: '/' },
    { name: 'Serviços', href: '/services' },
    { name: 'Preços', href: '/pricing' },
    { name: 'Depoimentos', href: '/testimonials' },
    { name: 'Sobre', href: '/about' },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-black/40 backdrop-blur-md text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/40 border-2 border-purple-500/60 h-12 w-12"
        >
          {isMobileMenuOpen ? <XIcon className="h-7 w-7" /> : <MenuIcon className="h-7 w-7" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-black/20 backdrop-blur-md border-b border-purple-500/50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-2xl font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                <span className="text-purple-300 drop-shadow-2xl group-hover:text-purple-200 transition-colors duration-300">GAME</span>
                <span className="text-white drop-shadow-2xl">BOOST</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-3 py-2 rounded-lg hover:bg-black/30 hover:shadow-lg hover:shadow-purple-500/30 border border-transparent hover:border-purple-500/40"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-12 w-12 rounded-full hover:bg-purple-600 border-2 border-purple-500/40"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-purple-500 text-white font-bold">U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 ml-4 bg-black/90 backdrop-blur-md border border-purple-500/40" align="end">
                  <DropdownMenuItem className="hover:bg-purple-600 hover:text-white text-white">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-purple-600 hover:text-white text-white">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-purple-600 hover:text-white text-white">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  className="text-white font-bold hover:text-purple-300 hover:bg-black/30 px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 text-lg border border-transparent hover:border-purple-500/40"
                  asChild
                >
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button
                  className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 py-2 border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 text-lg"
                  asChild
                >
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-md border-t border-purple-500/60">
            <nav className="px-6 py-6 space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-black/30 hover:shadow-lg hover:shadow-purple-500/30 border border-transparent hover:border-purple-500/40"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

    </>
  )
}
