'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Tema claro/escuro/sistema. The Sun/Moon icons crossfade via the `dark:` variant,
 * so no mounted-guard flicker is needed — the icon state follows the resolved class.
 *
 * Ao trocar, usa a View Transitions API para revelar o novo tema com uma frente curva
 * varrendo da esquerda para a direita (efeito de "onda"). Faz fallback silencioso para
 * troca instantânea onde a API não existe ou com `prefers-reduced-motion`.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme()

  const applyTheme = (next: 'light' | 'dark' | 'system') => {
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => unknown
    }
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!doc.startViewTransition || reduceMotion) {
      setTheme(next)
      return
    }

    doc.startViewTransition(() => setTheme(next))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Alternar tema">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyTheme('light')}>
          <Sun className="mr-2 h-4 w-4 text-current" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme('dark')}>
          <Moon className="mr-2 h-4 w-4 text-current" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme('system')}>
          <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-xs">⌘</span>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
