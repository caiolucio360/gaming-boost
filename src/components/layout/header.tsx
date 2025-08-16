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
import { GamepadIcon, UserIcon, LogOutIcon, SettingsIcon } from 'lucide-react'

export function Header() {
  const isAuthenticated = false // Substituir pela lógica de auth real

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <GamepadIcon className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GameBoost Pro
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            href="/games/lol" 
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            League of Legends
          </Link>
          <Link 
            href="/games/valorant" 
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            Valorant
          </Link>
          <Link 
            href="/games/cs2" 
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            Counter-Strike 2
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Cadastrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}