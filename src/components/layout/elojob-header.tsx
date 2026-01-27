'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldIcon, 
  UserIcon, 
  LogOutIcon, 
  ChevronDownIcon,
  ShoppingCartIcon,
  PackageIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

  // Gerar links de jogos dinamicamente baseado nos jogos habilitados
  const enabledGames = getEnabledGames()
  const gamesItems = enabledGames.map((game) => ({
    name: game.displayName,
    href: game.href,
  }))

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-black/80 backdrop-blur-md border-b border-brand-purple/20" role="banner">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-2 md:py-3 flex items-center justify-between">
        
        {/* Logo - Centered on mobile, left on desktop */}
        <Link href="/" className="flex items-center group flex-shrink-0 mx-auto lg:mx-0">
          <div>
            <h1 className="text-lg md:text-3xl font-black text-white font-orbitron">
              <span className="text-brand-purple-light group-hover:text-brand-purple transition-colors duration-300">GAME</span>
              <span className="text-white">BOOST</span>
            </h1>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            href="/"
            className="text-white font-medium hover:text-brand-purple-light transition-colors duration-300 text-base tracking-wide px-4 py-2 rounded-lg hover:bg-brand-purple/10"
          >
            Início
          </Link>
          
          {/* Links de jogos dinâmicos */}
          {gamesItems.length > 0 && gamesItems.length === 1 ? (
            <Link
              href={gamesItems[0].href}
              className="text-white font-medium hover:text-brand-purple-light transition-colors duration-300 text-base tracking-wide px-4 py-2 rounded-lg hover:bg-brand-purple/10"
            >
              {gamesItems[0].name}
            </Link>
          ) : gamesItems.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white font-medium hover:text-brand-purple-light transition-colors duration-300 text-base tracking-wide px-4 py-2 rounded-lg hover:bg-brand-purple/10 flex items-center data-[state=open]:bg-brand-purple/10"
                >
                  Jogos
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-brand-black-light backdrop-blur-md border-brand-purple/50 rounded-lg shadow-lg min-w-[12rem]">
                {gamesItems.map((game) => (
                  <DropdownMenuItem key={game.href} asChild>
                    <Link
                      href={game.href}
                      className="block text-white font-medium hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10 transition-colors duration-300 text-base tracking-wide py-3 px-4 rounded-lg cursor-pointer"
                    >
                      {game.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          
          <Link
            href="/how-it-works"
            className="text-white font-medium hover:text-brand-purple-light transition-colors duration-300 text-base tracking-wide px-4 py-2 rounded-lg hover:bg-brand-purple/10"
          >
            Como Funciona
          </Link>
          
          <Link
            href="/contact"
            className="text-white font-medium hover:text-brand-purple-light transition-colors duration-300 text-base tracking-wide px-4 py-2 rounded-lg hover:bg-brand-purple/10"
          >
            Contato
          </Link>
        </nav>

        {/* Auth Section - Hidden on mobile */}
        <div className="hidden lg:flex items-center space-x-4">
          {(authLoading && hasToken) || (!authLoading && user) ? (
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Se está carregando e há token mas ainda não há user, mostrar botão genérico */}
              {authLoading && hasToken && !user ? (
                <Button
                  variant="ghost"
                  className="text-white font-medium hover:text-brand-purple-light hover:bg-brand-purple/10 px-4 py-2 rounded-lg transition-colors duration-300 text-base"
                  disabled
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Carregando...
                </Button>
              ) : (
                <>
                  {/* Cart Button - Visible outside dropdown for CLIENT */}
                  {user && user.role === 'CLIENT' && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-white hover:text-brand-purple-light hover:bg-brand-purple/10 transition-colors duration-300 mr-2"
                            asChild
                          >
                            <Link href="/cart">
                              <ShoppingCartIcon className={`h-5 w-5 ${cartItemsCount > 0 ? 'animate-cartShake' : ''}`} />
                              {cartItemsCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 min-w-[20px] flex items-center justify-center p-0 bg-brand-purple text-white text-xs font-bold border-2 border-brand-black rounded-full">
                                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                </Badge>
                              )}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-brand-black-light border-brand-purple/50 text-white">
                          <p>{cartItemsCount > 0 ? `Carrinho (${cartItemsCount} item${cartItemsCount > 1 ? 's' : ''})` : 'Carrinho'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* User Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-white font-medium hover:text-brand-purple-light hover:bg-brand-purple/10 px-4 py-2 rounded-lg transition-colors duration-300 text-base flex items-center data-[state=open]:bg-brand-purple/10"
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        Minha Conta
                        <ChevronDownIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-brand-black-light backdrop-blur-md border-brand-purple/50 rounded-lg shadow-lg min-w-[12rem]">
                      
                      {/* ADMIN Options */}
                      {user && user.role === 'ADMIN' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <ShieldIcon className="mr-2 h-4 w-4" />
                              Admin
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
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
                            <Link href="/dashboard" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <PackageIcon className="mr-2 h-4 w-4" />
                              Meus Pedidos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/booster/apply" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <ShieldIcon className="mr-2 h-4 w-4" />
                              Seja um Booster
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
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
                            <Link href="/booster" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <PackageIcon className="mr-2 h-4 w-4" />
                              Meus Trabalhos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="w-full cursor-pointer text-white hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <UserIcon className="mr-2 h-4 w-4" />
                              Perfil
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* Common Options */}
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="w-full cursor-pointer text-brand-red hover:text-brand-red-light focus:text-brand-red-light focus:bg-brand-red/10"
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
                  className="relative text-white hover:text-brand-purple-light hover:bg-brand-purple/10 transition-colors duration-300"
                  asChild
                >
                  <Link href="/cart">
                    <ShoppingCartIcon className={`h-5 w-5 ${cartItemsCount > 0 ? 'animate-cartShake' : ''}`} />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-brand-purple text-white text-xs font-bold border-2 border-brand-black rounded-full">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </Badge>
                  </Link>
                </Button>
              )}

              <Button
                variant="ghost"
                className="text-white font-medium hover:text-brand-purple-light hover:bg-brand-purple/10 px-4 py-2 rounded-lg transition-colors duration-300 text-base"
                asChild
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button
                className="bg-brand-purple hover:bg-brand-purple-light text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 shadow-glow hover:shadow-glow-hover text-base"
                asChild
              >
                <Link href="/register">Cadastrar</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
