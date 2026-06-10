'use client'

import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ImageIcon, Loader2, X } from 'lucide-react'

interface CompletionProofDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the selected proof image when the booster confirms. */
  onConfirm: (file: File) => void
  /** True while the upload/completion request is in flight. */
  submitting: boolean
  /** Label shown on the submit button while submitting (e.g. "Enviando print..."). */
  submittingLabel?: string
}

/** Dialog that collects the completion-proof screenshot before marking an order COMPLETED. */
export function CompletionProofDialog({
  open,
  onOpenChange,
  onConfirm,
  submitting,
  submittingLabel = 'Enviando...',
}: CompletionProofDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(selected)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="bg-brand-black-light border-brand-purple/50 max-w-md">
        <DialogHeader>
          <DialogTitle>Comprovante de Conclusão</DialogTitle>
          <DialogDescription>
            Anexe um print da tela mostrando que o cliente atingiu o rank/rating contratado. Isso é obrigatório para concluir o pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {preview ? (
            <div className="relative">
              {/* Preview local do arquivo (blob: URL) antes do upload — next/image não suporta blob: */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview do comprovante"
                className="w-full rounded-lg border border-brand-purple/30 object-cover max-h-56"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={reset}
                className="absolute top-2 right-2 h-auto w-auto min-h-0 min-w-0 p-1 rounded-full bg-brand-black/70 border-transparent hover:bg-red-600/80"
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-auto flex-col border-2 border-dashed border-brand-purple/40 hover:border-brand-purple/80 rounded-lg p-8 gap-3 bg-brand-purple/5 hover:bg-brand-purple/10"
            >
              <ImageIcon className="h-10 w-10 text-brand-purple-light/60" />
              <span className="text-brand-gray-400 font-rajdhani text-sm">
                Clique para selecionar o print
              </span>
              <span className="text-brand-gray-500 font-rajdhani text-xs">
                JPG, PNG ou WebP — máx. 5 MB
              </span>
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => { reset(); onOpenChange(false) }}
            className="border-brand-purple/40 text-brand-gray-300 hover:bg-brand-purple/10"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => file && onConfirm(file)}
            disabled={!file || submitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {submittingLabel}</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Concluir Pedido</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
