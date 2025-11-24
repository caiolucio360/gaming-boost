'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldIcon, 
  UserIcon, 
  LogOutIcon, 
  SettingsIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  ShoppingCartIcon,
  PackageIcon,
  Bell
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { getEnabledGames } from '@/lib/games-config'
import { getAuthToken } from '@/lib/api-client'

import { NotificationBell } from '@/components/common/notification-bell'

export function ElojobHeader() {
  const router = useRouter()
  const { user, logout, loading: authLoading } = useAuth()
  const { items } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  // Verificar se há token no localStorage para evitar flash de "deslogado"
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken()
      setHasToken(!!token)
    }
  }, [])

  // Atualizar hasToken quando o user mudar (logout, etc)
  useEffect(() => {
    if (!user && !authLoading) {
      setHasToken(false)
    } else if (user) {
      setHasToken(true)
    }
  }, [user, authLoading])

  const cartItemsCount = items.length

  const handleLogout = async () => {
    await logout()
  }

  const navigationItems = [
    { name: 'Início', href: '/' },
    { name: 'Depoimentos', href: '/testimonials' },
    { name: 'Sobre', href: '/about' },
  ]

  // Gerar links de jogos dinamicamente baseado nos jogos habilitados
  const enabledGames = getEnabledGames()
  const gamesItems = enabledGames.map((game) => ({
    name: game.displayName,
    href: game.href,
  }))

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-2 md:py-3 flex items-center justify-between">
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-black/50 backdrop-blur-md text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/40 border border-purple-500/60 h-10 w-10 rounded-lg"
            >
              {isMobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0 mx-auto lg:mx-0">
            <div>
              <h1 className="text-lg md:text-3xl font-black text-white drop-shadow-2xl font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                <span className="text-purple-300 drop-shadow-2xl group-hover:text-purple-200 transition-colors duration-300">GAME</span>
                <span className="text-white drop-shadow-2xl">BOOST</span>
              </h1>
            </div>
          </Link>

          {/* Spacer para centralizar logo no mobile */}
          <div className="lg:hidden w-10"></div>

                  {/* Desktop Navigation */}
                  <nav className="hidden lg:flex items-center space-x-8">
                    <Link
                      href="/"
                      className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10"
                    >
                      Início
                    </Link>
                    
                    {/* Links de jogos dinâmicos */}
                    {gamesItems.length > 0 && gamesItems.length === 1 ? (
                      <Link
                        href={gamesItems[0].href}
                        className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10"
                      >
                        {gamesItems[0].name}
                      </Link>
                    ) : gamesItems.length > 1 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide px-4 py-2 rounded-lg hover:bg-purple-500/10 flex items-center data-[state=open]:bg-purple-500/10"
                          >
                            Jogos
                            <ChevronDownIcon className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black/90 backdrop-blur-md border-purple-500/50 rounded-lg shadow-lg min-w-[12rem]">
                          {gamesItems.map((game) => (
                            <DropdownMenuItem key={game.href} asChild>
                              <Link
                                href={game.href}
                                className="block text-white font-bold hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10 transition-colors duration-300 text-base tracking-wide py-3 px-4 rounded-lg cursor-pointer"
                              >
                                {game.name}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    
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

          {/* Auth Section - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-4">
            {(authLoading && hasToken) || (!authLoading && user) ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />
                
                {/* Se está carregando e há token mas ainda não há user, mostrar botão genérico */}
                {authLoading && hasToken && !user ? (
                  <Button
                    variant="ghost"
                    className="text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 px-4 py-2 rounded-lg transition-colors duration-300 text-lg"
                    disabled
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Carregando...
                  </Button>
                ) : (
                  <>
                    {/* Cart Button - Visible outside dropdown for CLIENT */}
                    {user && user.role === 'CLIENT' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-white hover:text-purple-300 hover:bg-purple-500/10 transition-colors duration-300 mr-2"
                        asChild
                      >
                        <Link href="/cart">
                          <ShoppingCartIcon className="h-5 w-5" />
                          {cartItemsCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 min-w-[20px] flex items-center justify-center p-0 bg-purple-500 text-white text-xs font-bold border-2 border-black rounded-full">
                              {cartItemsCount > 9 ? '9+' : cartItemsCount}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    )}

                    {/* User Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 px-4 py-2 rounded-lg transition-colors duration-300 text-lg flex items-center data-[state=open]:bg-purple-500/10"
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          Minha Conta
                          <ChevronDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-md border-purple-500/50 rounded-lg shadow-lg min-w-[12rem]">
                        
                        {/* ADMIN Options */}
                        {user && user.role === 'ADMIN' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/admin" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <ShieldIcon className="mr-2 h-4 w-4" />
                                Admin
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/profile" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <UserIcon className="mr-2 h-4 w-4" />
                                Perfil
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* CLIENT Options */}
                        {user && user.role === 'CLIENT' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/dashboard" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <PackageIcon className="mr-2 h-4 w-4" />
                                Meus Pedidos
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/booster/apply" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <ShieldIcon className="mr-2 h-4 w-4" />
                                Seja um Booster
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/profile" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <UserIcon className="mr-2 h-4 w-4" />
                                Perfil
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* BOOSTER Options */}
                        {user && user.role === 'BOOSTER' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href="/booster" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <PackageIcon className="mr-2 h-4 w-4" />
                                Meus Trabalhos
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/profile" className="w-full cursor-pointer text-white hover:text-purple-300 focus:text-purple-300 focus:bg-purple-500/10">
                                <UserIcon className="mr-2 h-4 w-4" />
                                Perfil
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Common Options */}
                        <DropdownMenuItem 
                          onClick={handleLogout}
                          className="w-full cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                        >
                          <LogOutIcon className="mr-2 h-4 w-4" />
                          Sair
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ) : !authLoading ? (
              <div className="flex items-center space-x-4">
                {/* Carrinho - visível mesmo sem login */}
                {cartItemsCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:text-purple-300 hover:bg-purple-500/10 transition-colors duration-300"
                    asChild
                  >
                    <Link href="/cart">
                      <ShoppingCartIcon className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-purple-500 text-white text-xs font-bold border-2 border-black">
                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                      </Badge>
                    </Link>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 px-4 py-2 rounded-lg transition-colors duration-300 text-lg"
                  asChild
                >
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button
                  className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 py-2 border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 text-lg"
                  asChild
                >
                  <Link href="/register">Cadastrar</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                  <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-t border-purple-500/60 z-[60]">
                    <nav className="px-6 py-6 space-y-4">
                      <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                      >
                        Início
                      </Link>
                      
                      {/* Links de jogos dinâmicos no mobile */}
                      {gamesItems.length > 0 && gamesItems.length === 1 ? (
                        <Link
                          href={gamesItems[0].href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                        >
                          {gamesItems[0].name}
                        </Link>
                      ) : gamesItems.length > 1 ? (
                        <>
                          <div className="block text-white font-bold text-lg tracking-wide py-3 px-4">
                            Jogos:
                          </div>
                          {gamesItems.map((game) => (
                            <Link
                              key={game.href}
                              href={game.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-base tracking-wide py-2 px-8 rounded-lg hover:bg-purple-500/10"
                            >
                              {game.name}
                            </Link>
                          ))}
                        </>
                      ) : null}
                      
                      <Link
                        href="/testimonials"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                      >
                        Depoimentos
                      </Link>
                      
                      <Link
                        href="/about"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-white font-bold hover:text-purple-300 transition-colors duration-300 text-lg tracking-wide py-3 px-4 rounded-lg hover:bg-purple-500/10"
                      >
                        Sobre
                      </Link>

                      {/* Auth links in mobile menu */}
                      {(!authLoading || hasToken) && (
                        <div className="border-t border-purple-500/30 pt-4 mt-4">
                          {(authLoading && hasToken) || (!authLoading && user) ? (
                            <div className="space-y-2">
                              {/* Se está carregando e há token mas ainda não há user, mostrar botão genérico */}
                              {authLoading && hasToken && !user ? (
                                <Button
                                  variant="ghost"
                                  className="w-full text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 rounded-lg transition-colors duration-300 justify-start"
                                  disabled
                                >
                                  <UserIcon className="mr-2 h-5 w-5" />
                                  Carregando...
                                </Button>
                              ) : (
                                <>
                                  <Link
                                    href="/notifications"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <Bell className="h-5 w-5" />
                                    <span>Notificações</span>
                                  </Link>
                                  {/* ADMIN no mobile: Admin, Perfil e Logout */}
                                  {user && user.role === 'ADMIN' && (
                                <>
                                  <Link
                                    href="/admin"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300 border border-purple-500/30"
                                  >
                                    <ShieldIcon className="h-5 w-5" />
                                    <span>Admin</span>
                                  </Link>
                                  <Link
                                    href="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <UserIcon className="h-5 w-5" />
                                    <span>Perfil</span>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-white font-bold hover:text-red-300 hover:bg-red-500/10 py-3 rounded-lg transition-colors duration-300 justify-start"
                                    onClick={() => {
                                      setIsMobileMenuOpen(false)
                                      handleLogout()
                                    }}
                                  >
                                    <LogOutIcon className="mr-2 h-5 w-5" />
                                    Sair
                                  </Button>
                                </>
                              )}

                              {/* CLIENT no mobile: Carrinho, Meus Pedidos, Perfil e Logout */}
                              {user && user.role === 'CLIENT' && (
                                <>
                                  <Link
                                    href="/cart"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <ShoppingCartIcon className="h-5 w-5" />
                                      <span>Carrinho</span>
                                    </div>
                                    {cartItemsCount > 0 && (
                                      <Badge className="bg-purple-500 text-white text-xs font-bold min-w-[24px] flex items-center justify-center">
                                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                      </Badge>
                                    )}
                                  </Link>
                                  <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <PackageIcon className="h-5 w-5" />
                                    <span>Meus Pedidos</span>
                                  </Link>
                                  <Link
                                    href="/booster/apply"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-purple-300 font-bold hover:text-white hover:bg-purple-500/20 py-3 px-4 rounded-lg transition-colors duration-300 border border-purple-500/50"
                                  >
                                    <ShieldIcon className="h-5 w-5" />
                                    <span>Seja um Booster</span>
                                  </Link>
                                  <Link
                                    href="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <UserIcon className="h-5 w-5" />
                                    <span>Perfil</span>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-white font-bold hover:text-red-300 hover:bg-red-500/10 py-3 rounded-lg transition-colors duration-300 justify-start"
                                    onClick={() => {
                                      setIsMobileMenuOpen(false)
                                      handleLogout()
                                    }}
                                  >
                                    <LogOutIcon className="mr-2 h-5 w-5" />
                                    Sair
                                  </Button>
                                </>
                              )}

                              {/* BOOSTER no mobile: Meus Trabalhos, Perfil e Logout */}
                              {user && user.role === 'BOOSTER' && (
                                <>
                                  <Link
                                    href="/booster"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <PackageIcon className="h-5 w-5" />
                                    <span>Meus Trabalhos</span>
                                  </Link>
                                  <Link
                                    href="/profile"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                  >
                                    <UserIcon className="h-5 w-5" />
                                    <span>Perfil</span>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-white font-bold hover:text-red-300 hover:bg-red-500/10 py-3 rounded-lg transition-colors duration-300 justify-start"
                                    onClick={() => {
                                      setIsMobileMenuOpen(false)
                                      handleLogout()
                                    }}
                                  >
                                    <LogOutIcon className="mr-2 h-5 w-5" />
                                    Sair
                                  </Button>
                                </>
                              )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {/* Carrinho no mobile (sem login) */}
                              {cartItemsCount > 0 && (
                                <Link
                                  href="/cart"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center justify-between text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 px-4 rounded-lg transition-colors duration-300"
                                >
                                  <div className="flex items-center space-x-2">
                                    <ShoppingCartIcon className="h-5 w-5" />
                                    <span>Carrinho</span>
                                  </div>
                                  <Badge className="bg-purple-500 text-white text-xs font-bold">
                                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                  </Badge>
                                </Link>
                              )}

                              <Button
                                variant="ghost"
                                className="text-white font-bold hover:text-purple-300 hover:bg-purple-500/10 py-3 rounded-lg transition-colors duration-300 justify-start"
                                asChild
                              >
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Entrar</Link>
                              </Button>
                              <Button
                                className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 rounded-lg transition-all duration-300 border-2 border-purple-500"
                                asChild
                              >
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Cadastrar</Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </nav>
                  </div>
                )}
      </header>

    </>
  )
}
