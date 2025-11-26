'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { showSuccess, showError } from '@/lib/toast'
import { ButtonLoading } from '@/components/common/button-loading'

const applySchema = z.object({
  bio: z.string().min(10, 'Sua bio deve ter pelo menos 10 caracteres'),
  languages: z.array(z.string()).min(1, 'Selecione pelo menos um idioma'),
  portfolioUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

type ApplyFormData = z.infer<typeof applySchema>

const LANGUAGES = [
  { id: 'pt-BR', label: 'Português (Brasil)' },
  { id: 'en-US', label: 'Inglês' },
  { id: 'es', label: 'Espanhol' },
]

export function ApplyForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      bio: '',
      languages: ['pt-BR'],
      portfolioUrl: '',
    },
  })

  const selectedLanguages = watch('languages')

  const handleLanguageChange = (langId: string, checked: boolean) => {
    if (checked) {
      setValue('languages', [...selectedLanguages, langId])
    } else {
      setValue(
        'languages',
        selectedLanguages.filter((id) => id !== langId)
      )
    }
  }

  const onSubmit = async (data: ApplyFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/booster/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar aplicação')
      }

      showSuccess('Aplicação enviada!', 'Analisaremos seu perfil em breve.')
      router.replace('/dashboard')
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Tente novamente')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white font-orbitron">
          Torne-se um Booster
        </CardTitle>
        <CardDescription className="text-gray-400 font-rajdhani">
          Preencha o formulário abaixo para se candidatar. Buscamos jogadores de alto nível!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white font-rajdhani">
              Sobre você (Bio)
            </Label>
            <Textarea
              id="bio"
              placeholder="Conte sua experiência, ranks alcançados, etc..."
              className="bg-black/50 border-purple-500/30 text-white min-h-[100px]"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-red-400 text-sm">{errors.bio.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white font-rajdhani">Idiomas</Label>
            <div className="flex flex-wrap gap-4">
              {LANGUAGES.map((lang) => (
                <div key={lang.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang.id}`}
                    checked={selectedLanguages.includes(lang.id)}
                    onCheckedChange={(checked) =>
                      handleLanguageChange(lang.id, checked as boolean)
                    }
                    className="border-purple-500 data-[state=checked]:bg-purple-600"
                  />
                  <Label
                    htmlFor={`lang-${lang.id}`}
                    className="text-gray-300 cursor-pointer"
                  >
                    {lang.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.languages && (
              <p className="text-red-400 text-sm">{errors.languages.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolioUrl" className="text-white font-rajdhani">
              Link do Portfólio / Provas (Opcional)
            </Label>
            <Input
              id="portfolioUrl"
              placeholder="https://imgur.com/..."
              className="bg-black/50 border-purple-500/30 text-white"
              {...register('portfolioUrl')}
            />
            {errors.portfolioUrl && (
              <p className="text-red-400 text-sm">{errors.portfolioUrl.message}</p>
            )}
          </div>

          <ButtonLoading
            type="submit"
            loading={isSubmitting}
            loadingText="Enviando..."
            className="w-full bg-purple-600 text-white font-bold py-3 border border-transparent hover:border-white/50"
          >
            Enviar Aplicação
          </ButtonLoading>
        </form>
      </CardContent>
    </Card>
  )
}
