'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { showSuccess, showError } from '@/lib/toast'
import { ButtonLoading } from '@/components/common/button-loading'
import { AlertTriangle } from 'lucide-react'

const disputeSchema = z.object({
  reason: z.string().min(20, 'Por favor, descreva o problema com no mínimo 20 caracteres'),
})

type DisputeFormData = z.infer<typeof disputeSchema>

interface DisputeModalProps {
  orderId: number
  onClose: () => void
  onSuccess?: () => void
}

export function DisputeModal({ orderId, onClose, onSuccess }: DisputeModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: '',
    },
  })

  const onSubmit = async (data: DisputeFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          reason: data.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao abrir disputa')
      }

      const result = await response.json()
      showSuccess('Disputa criada!', 'Nossa equipe analisará seu caso em breve.')
      
      if (onSuccess) {
        onSuccess()
      }
      
      // Navigate to dispute page
      router.replace(`/disputes/${result.dispute.id}`)
      onClose()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Tente novamente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="bg-black/40 backdrop-blur-md border-red-500/50 w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <CardTitle className="text-2xl font-bold text-white font-orbitron">
                Abrir Disputa
              </CardTitle>
              <CardDescription className="text-gray-400 font-rajdhani">
                Pedido #{orderId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-200" />
              <AlertDescription className="text-sm text-yellow-200 font-rajdhani">
                <strong>Importante:</strong> Disputas devem ser abertas apenas para problemas sérios com o serviço. 
                Nossa equipe irá analisar o caso e tomar uma decisão justa.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white font-rajdhani font-semibold">
                Descreva o problema
              </Label>
              <Textarea
                id="reason"
                placeholder="Explique detalhadamente o que aconteceu com seu pedido..."
                className="bg-black/50 border-red-500/30 text-white min-h-[150px]"
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-red-400 text-sm">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white font-rajdhani"
              >
                Cancelar
              </Button>
              <ButtonLoading
                type="submit"
                loading={isSubmitting}
                loadingText="Abrindo..."
                className="bg-red-600 text-white font-bold font-rajdhani border border-transparent hover:border-white/50"
              >
                Abrir Disputa
              </ButtonLoading>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
