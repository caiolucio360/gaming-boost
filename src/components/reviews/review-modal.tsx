'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { showSuccess, showError } from '@/lib/toast'
import { LoadingSpinner } from '@/components/common/loading-spinner'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Selecione uma nota').max(5),
  comment: z.string().optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewModalProps {
  orderId: number
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ReviewModal({ orderId, trigger, onSuccess }: ReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  })

  const currentRating = watch('rating')

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar avaliação')
      }

      showSuccess('Avaliação enviada!', 'Obrigado pelo seu feedback.')
      setIsOpen(false)
      reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Tente novamente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Avaliar Pedido</Button>}
      </DialogTrigger>
      <DialogContent className="bg-black/90 border-purple-500/50 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">Avaliar Serviço</DialogTitle>
          <DialogDescription className="font-rajdhani text-gray-400">
            Como foi sua experiência com este booster?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-2">
            <Label className="font-rajdhani">Sua Nota</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setValue('rating', star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || currentRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-red-400 text-sm">{errors.rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="font-rajdhani">
              Comentário (Opcional)
            </Label>
            <Textarea
              id="comment"
              placeholder="O booster foi rápido, educado..."
              className="bg-black/50 border-purple-500/30 text-white min-h-[100px]"
              {...register('comment')}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || currentRating === 0}
              className="w-full bg-purple-600 text-white font-bold border border-transparent hover:border-white/50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
