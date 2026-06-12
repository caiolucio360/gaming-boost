'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ButtonLoading } from '@/components/common/button-loading'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { validateCPF, validatePhone, formatTaxId, formatPhone, maskCPF, maskPhone } from '@/lib/brazilian'
import { api } from '@/lib/api-client'

interface PaymentResult {
  id: number
  pixCode: string
  qrCode: string
  total: number
  expiresAt: string
  status: string
}

interface PaymentFormProps {
  orderId: number
  orderTotal: number
  onSuccess: (payment: PaymentResult) => void
  onError: (error: string) => void
}

export function PaymentForm({ orderId, orderTotal, onSuccess, onError }: PaymentFormProps) {
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; taxId?: string }>({})

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Auto-format while typing
    const formatted = maskPhone(value)
    setPhone(formatted)
    
    // Clear error when user types
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }))
    }
  }

  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Auto-format while typing
    const formatted = maskCPF(value)
    setTaxId(formatted)
    
    // Clear error when user types
    if (errors.taxId) {
      setErrors(prev => ({ ...prev, taxId: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({})
    
    // Validate phone
    if (!validatePhone(phone)) {
      setErrors(prev => ({ ...prev, phone: 'Telefone inválido. Use o formato: (11) 99999-9999' }))
      return
    }
    
    // Validate CPF
    if (!validateCPF(taxId)) {
      setErrors(prev => ({ ...prev, taxId: 'CPF inválido' }))
      return
    }

    setIsLoading(true)

    try {
      // Format data for API (remove formatting)
      const formattedPhone = formatPhone(phone)   // +5511999999999
      const formattedTaxId = formatTaxId(taxId)   // 12345678900

      const data = await api.post<{ payment: Parameters<typeof onSuccess>[0] }>('/api/payment/pix', {
        orderId,
        phone: formattedPhone,
        taxId: formattedTaxId,
      })

      onSuccess(data.payment)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao gerar pagamento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-muted/60 backdrop-blur-md border-brand-purple/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground font-orbitron">
          Pagamento via <span className="text-brand-purple-light">PIX</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground font-rajdhani">
          Total: <span className="text-foreground font-bold">R$ {orderTotal.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground font-rajdhani">
              Telefone (com DDD)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              required
              maxLength={15}
              className="bg-black/50 border-brand-purple/50 text-foreground placeholder-brand-gray-400 focus:border-brand-purple-light focus:ring-brand-purple-light"
            />
            {errors.phone && (
              <p className="text-red-400 text-sm font-rajdhani">{errors.phone}</p>
            )}
            <p className="text-muted-foreground text-xs font-rajdhani">
              Necessário para confirmar o pagamento PIX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-foreground font-rajdhani">
              CPF
            </Label>
            <Input
              id="taxId"
              type="text"
              value={taxId}
              onChange={handleTaxIdChange}
              placeholder="000.000.000-00"
              required
              maxLength={14}
              className="bg-black/50 border-brand-purple/50 text-foreground placeholder-brand-gray-400 focus:border-brand-purple-light focus:ring-brand-purple-light"
            />
            {errors.taxId && (
              <p className="text-red-400 text-sm font-rajdhani">{errors.taxId}</p>
            )}
            <p className="text-muted-foreground text-xs font-rajdhani">
              Requerido pela operadora de pagamento
            </p>
          </div>

          <Alert className="bg-brand-purple/10 border-brand-purple/30">
            <AlertDescription className="text-muted-foreground text-sm font-rajdhani">
              ℹ️ Seus dados são usados apenas para processar o pagamento e não serão armazenados.
            </AlertDescription>
          </Alert>

          <ButtonLoading
            type="submit"
            loading={isLoading}
            loadingText="Gerando PIX..."
            className="w-full bg-brand-purple text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani"
          >
            GERAR CÓDIGO PIX
          </ButtonLoading>
        </form>
      </CardContent>
    </Card>
  )
}
