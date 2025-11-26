'use client'

import Link from 'next/link'

/**
 * Skip Link para acessibilidade
 * Permite que usuários de teclado pulem diretamente para o conteúdo principal
 * 
 * @see https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html
 */
export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black"
    >
      Pular para o conteúdo principal
    </Link>
  )
}

