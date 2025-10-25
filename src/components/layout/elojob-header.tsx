'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ShieldIcon, 
  UserIcon, 
  LogOutIcon, 
  SettingsIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon
} from 'lucide-react'
import { useState } from 'react'

export function ElojobHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGamesMenuOpen, setIsGamesMenuOpen] = useState(false)

  const navigationItems = [
    { name: 'Início', href: '/' },
    { name: 'Serviços', href: '/services' },
    { name: 'Depoimentos', href: '/testimonials' },
    { name: 'Sobre', href: '/about' },
  ]

  const gamesItems = [
    { name: 'Counter-Strike 2', href: '/games/cs2' },
  ]

  // Fechar menu quando clicar fora
  const handleClickOutside = () => {
    setIsGamesMenuOpen(false)
  }

  return (
    <>
      {/* Overlay para fechar menu quando clicar fora */}
      {isGamesMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
        />
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-black/50 backdrop-blur-md text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/40 border border-purple-500/60 h-10 w-10 rounded-lg"
        >
          {isMobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-purple-500/50">
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
                  <nav className="hidden lg:flex items-center space-x-8">
                    <Link
                      href="/"
                      className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Início
                    </Link>
                    
                    <Link
                      href="/services"
                      className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Serviços
                    </Link>
                    
                    {/* Games Menu - Custom Implementation */}
                    <div className="relative">
                      <button
                        onClick={() => setIsGamesMenuOpen(!isGamesMenuOpen)}
                        className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10 flex items-center space-x-1"
                      >
                        <span>Jogos</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isGamesMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Custom Games Menu */}
                      {isGamesMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 rounded-xl p-2 z-50">
                          <div className="px-3 py-2">
                            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Escolha o jogo</p>
                          </div>
                          {gamesItems.map((game) => (
                            <Link
                              key={game.name}
                              href={game.href}
                              className="flex items-center space-x-3 text-white hover:bg-purple-500/20 hover:text-purple-200 transition-colors duration-200 rounded-lg px-3 py-3 cursor-pointer group"
                              onClick={() => setIsGamesMenuOpen(false)}
                            >
                              <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors"></div>
                              <span className="font-medium">{game.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Link
                      href="/testimonials"
                      className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Depoimentos
                    </Link>
                    
                    <Link
                      href="/about"
                      className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Sobre
                    </Link>
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
                <DropdownMenuContent className="w-56 ml-4 bg-black/90 backdrop-blur-md border border-purple-500/40 z-[70]" align="end">
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
                  className="text-white font-bold hover:text-purple-300 hover:bg-purple-500/20 px-4 py-2 rounded-lg transition-all duration-500 text-lg hover:scale-105"
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
                  <div className="lg:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-md border-t border-purple-500/60 z-[60]">
                    <nav className="px-6 py-6 space-y-4">
                      <Link
                        href="/"
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Início
                      </Link>
                      
                      <Link
                        href="/services"
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Serviços
                      </Link>
                      
                      {/* Mobile Games Section - Professional Design */}
                      <div className="border-t border-purple-500/30 pt-4 mt-4">
                        <h3 className="text-purple-300 font-bold text-lg mb-3 flex items-center">
                          <span>Jogos</span>
                          <div className="w-2 h-2 bg-purple-400 rounded-full ml-2"></div>
                        </h3>
                        <div className="space-y-2">
                          {gamesItems.map((game) => (
                            <Link
                              key={game.name}
                              href={game.href}
                              className="block text-white hover:text-purple-300 transition-colors duration-300 text-base py-3 px-6 rounded-lg hover:bg-purple-500/10 flex items-center space-x-3 group"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors"></div>
                              <span className="font-medium">{game.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                      
                      <Link
                        href="/testimonials"
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Depoimentos
                      </Link>
                      
                      <Link
                        href="/about"
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sobre
                      </Link>
                    </nav>
                  </div>
                )}
      </header>

    </>
  )
}
