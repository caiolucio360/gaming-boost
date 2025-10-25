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
  HomeIcon, 
  WrenchIcon, 
  DollarSignIcon, 
  InfoIcon, 
  UserIcon, 
  LogOutIcon, 
  SettingsIcon,
  MenuIcon,
  XIcon
} from 'lucide-react'
import { useState } from 'react'

export function VerticalNavbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { name: 'Início', href: '/', icon: HomeIcon },
    { name: 'Serviços', href: '/services', icon: WrenchIcon },
    { name: 'Preços', href: '/pricing', icon: DollarSignIcon },
    { name: 'Sobre', href: '/about', icon: InfoIcon },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-brand-black text-white hover:bg-brand-purple-dark"
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

      {/* Vertical Navbar */}
      <nav className={`
        fixed left-0 top-0 h-full w-64 bg-gradient-brand z-30 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-brand-purple-dark">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-brand-purple rounded-lg group-hover:bg-brand-purple-light transition-colors">
                <GamepadIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GameBoost</h1>
                <p className="text-xs text-brand-purple-lighter">Pro</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-brand-purple-dark hover-lift transition-all duration-300 group"
                  >
                    <item.icon className="h-5 w-5 group-hover:text-brand-purple-light transition-colors" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Auth Section */}
          <div className="p-4 border-t border-brand-purple-dark">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-3 hover:bg-brand-purple-dark hover-lift"
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-brand-purple text-white">U</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Usuário</p>
                      <p className="text-xs text-gray-400">user@email.com</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 ml-4" align="start">
                  <DropdownMenuItem className="hover:bg-brand-purple-light hover:text-white">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-brand-purple-light hover:text-white">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-brand-purple-light hover:text-white">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full bg-brand-purple hover:bg-brand-purple-light hover-glow hover-color-transition"
                >
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white hover-color-transition"
                >
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content spacer */}
      <div className="hidden lg:block w-64" />
    </>
  )
}
