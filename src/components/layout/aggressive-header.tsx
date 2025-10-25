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
  GamepadIcon, 
  UserIcon, 
  LogOutIcon, 
  SettingsIcon,
  MenuIcon,
  XIcon
} from 'lucide-react'
import { useState } from 'react'

export function AggressiveHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { name: 'INÍCIO', href: '/' },
    { name: 'SERVIÇOS', href: '/services' },
    { name: 'PREÇOS', href: '/pricing' },
    { name: 'DEPOIMENTOS', href: '/testimonials' },
    { name: 'SOBRE', href: '/about' },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-brand-black text-white hover:bg-red-600"
        >
          {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
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
      <header className="fixed top-0 left-0 right-0 z-30 bg-brand-black/95 backdrop-blur-md border-b border-red-600">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-red-600 rounded-lg group-hover:bg-red-700 transition-colors">
              <GamepadIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                <span className="text-red-600">GAME</span>
                <span className="text-white">BOOST</span>
              </h1>
              <p className="text-xs text-gray-400 font-bold">PRO</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white font-bold hover:text-red-600 transition-colors duration-300 text-sm tracking-wide"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full hover:bg-red-600"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-red-600 text-white">U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 ml-4" align="end">
                  <DropdownMenuItem className="hover:bg-red-600 hover:text-white">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-red-600 hover:text-white">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-red-600 hover:text-white">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  className="text-white font-bold hover:text-red-600 hover:bg-transparent"
                  asChild
                >
                  <Link href="/login">ENTRAR</Link>
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 border-2 border-red-600 hover:border-red-700 transition-all duration-300"
                  asChild
                >
                  <Link href="/register">CADASTRAR</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-brand-black border-t border-red-600">
            <nav className="px-4 py-6 space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-white font-bold hover:text-red-600 transition-colors duration-300 text-sm tracking-wide py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main content spacer */}
      <div className="h-20" />
    </>
  )
}
