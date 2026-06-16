'use client'

import Link from 'next/link'
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
import { cn } from '@/lib/utils'

import { NotificationBell } from '@/components/common/notification-bell'
import { ThemeToggle } from '@/components/common/theme-toggle'

// Shared style for top-bar nav links and ghost buttons. Compose extras with
// `cn(navLinkClass, '...')` (e.g. dropdown triggers add flex + open-state bg).
const navLinkClass =
  'text-foreground font-medium hover:text-brand-purple-light hover:bg-brand-purple/10 transition-colors duration-300 text-base tracking-wide px-4 py-2 rounded-lg'

export function ElojobHeader() {
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" role="banner">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-2 md:py-3 flex items-center justify-between">
        
        {/* Logo - Centered on mobile, left on desktop */}
        <Link href="/" className="flex items-center flex-shrink-0 mx-auto lg:mx-0">
          <span className="font-brush -skew-x-6 text-2xl md:text-3xl tracking-widest">
            <span className="text-brand-purple-light">FLAUTAS</span>
            <span className="text-foreground">BOOST</span>
            {/* logo keeps the brand-purple accent; BOOST adapts to the theme */}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link href="/" className={navLinkClass}>
            Início
          </Link>
          
          {/* Links de jogos dinâmicos */}
          {gamesItems.length > 0 && gamesItems.length === 1 ? (
            <Link href={gamesItems[0].href} className={navLinkClass}>
              {gamesItems[0].name}
            </Link>
          ) : gamesItems.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(navLinkClass, 'flex items-center data-[state=open]:bg-brand-purple/10')}
                >
                  Jogos
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover backdrop-blur-md border-border rounded-lg shadow-lg min-w-[12rem]">
                {gamesItems.map((game) => (
                  <DropdownMenuItem key={game.href} asChild>
                    <Link
                      href={game.href}
                      className="block text-foreground font-medium hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10 transition-colors duration-300 text-base tracking-wide py-3 px-4 rounded-lg cursor-pointer"
                    >
                      {game.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          
          <Link href="/how-it-works" className={navLinkClass}>
            Como Funciona
          </Link>
          
        </nav>

        {/* Auth Section - Hidden on mobile */}
        <div className="hidden lg:flex items-center space-x-4">
          <ThemeToggle />
          {(authLoading && hasToken) || (!authLoading && user) ? (
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Se está carregando e há token mas ainda não há user, mostrar botão genérico */}
              {authLoading && hasToken && !user ? (
                <Button variant="ghost" className={navLinkClass} disabled>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Carregando…
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
                            className="relative text-foreground hover:text-brand-purple-light hover:bg-brand-purple/10 transition-colors duration-300 mr-2"
                            asChild
                          >
                            <Link href="/cart" aria-label={cartItemsCount > 0 ? `Carrinho, ${cartItemsCount} ${cartItemsCount > 1 ? 'itens' : 'item'}` : 'Carrinho'}>
                              <ShoppingCartIcon className={`h-5 w-5 ${cartItemsCount > 0 ? 'animate-cartShake' : ''}`} aria-hidden="true" />
                              {cartItemsCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 min-w-[20px] flex items-center justify-center p-0 bg-brand-purple text-white text-xs font-bold border-2 border-background rounded-full">
                                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                </Badge>
                              )}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover border-border text-popover-foreground">
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
                        className={cn(navLinkClass, 'flex items-center data-[state=open]:bg-brand-purple/10')}
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        Minha Conta
                        <ChevronDownIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover backdrop-blur-md border-border rounded-lg shadow-lg min-w-[12rem]">
                      
                      {/* ADMIN Options */}
                      {user && user.role === 'ADMIN' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="w-full cursor-pointer text-foreground hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <ShieldIcon className="mr-2 h-4 w-4" />
                              Admin
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="w-full cursor-pointer text-foreground hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
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
                            <Link href="/dashboard" className="w-full cursor-pointer text-foreground hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <PackageIcon className="mr-2 h-4 w-4" />
                              Meus Pedidos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="w-full cursor-pointer text-foreground hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
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
                            <Link href="/booster" className="w-full cursor-pointer text-foreground hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
                              <PackageIcon className="mr-2 h-4 w-4" />
                              Meus Trabalhos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="w-full cursor-pointer text-foreground hover:text-brand-purple-light focus:text-brand-purple-light focus:bg-brand-purple/10">
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
                  className="relative text-foreground hover:text-brand-purple-light hover:bg-brand-purple/10 transition-colors duration-300"
                  asChild
                >
                  <Link href="/cart" aria-label={`Carrinho, ${cartItemsCount} ${cartItemsCount > 1 ? 'itens' : 'item'}`}>
                    <ShoppingCartIcon className={`h-5 w-5 ${cartItemsCount > 0 ? 'animate-cartShake' : ''}`} aria-hidden="true" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-brand-purple text-white text-xs font-bold border-2 border-background rounded-full">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </Badge>
                  </Link>
                </Button>
              )}

              <Button variant="ghost" className={navLinkClass} asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button className="px-6 text-base" asChild>
                <Link href="/register">Cadastrar</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
