'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationControlsProps {
  /** Página atual (base 1) */
  page: number
  pageSize: number
  /** Total de registros (do servidor) */
  total: number
  onPageChange: (page: number) => void
  /** Nome do item para o resumo (ex.: "usuário", "pedido") */
  itemLabel?: string
  className?: string
}

/**
 * Controle de paginação server-side reutilizável: resumo "Exibindo X–Y de Z" +
 * navegação anterior/próxima com indicador de página. Esconde a navegação quando
 * há uma única página, mas mantém o resumo.
 */
export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'registro',
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const plural = total !== 1 ? 's' : ''

  return (
    <div
      className={cn(
        'mt-6 flex flex-col sm:flex-row items-center justify-between gap-4',
        className
      )}
    >
      <p className="text-sm text-muted-foreground font-rajdhani">
        {total === 0
          ? `Nenhum ${itemLabel}`
          : `Exibindo ${from}–${to} de ${total} ${itemLabel}${plural}`}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-brand-purple/50 text-foreground hover:bg-brand-purple/10 font-rajdhani"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground font-rajdhani min-w-24 text-center">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="border-brand-purple/50 text-foreground hover:bg-brand-purple/10 font-rajdhani"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
