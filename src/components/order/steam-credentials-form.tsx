'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ButtonLoading } from '@/components/common/button-loading'
import { showSuccess, showError } from '@/lib/toast'
import { Lock, Shield, Eye, EyeOff } from 'lucide-react'

const steamCredentialsSchema = z.object({
    steamProfileUrl: z.string()
        .min(1, 'URL do perfil Steam é obrigatória')
        .regex(
            /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/,
            'URL inválida. Use: steamcommunity.com/id/username ou steamcommunity.com/profiles/id'
        ),
    username: z.string().min(1, 'Usuário é obrigatório'),
    password: z.string().min(1, 'Senha é obrigatória'),
    consent: z.boolean().refine(val => val === true, {
        message: 'Você precisa concordar com o compartilhamento de credenciais'
    }),
})

type SteamCredentialsFormData = z.infer<typeof steamCredentialsSchema>

interface SteamCredentialsFormProps {
    orderId: number
    onSuccess?: () => void
    existingProfileUrl?: string
}

export default function SteamCredentialsForm({ 
    orderId, 
    onSuccess,
    existingProfileUrl 
}: SteamCredentialsFormProps) {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SteamCredentialsFormData>({
        resolver: zodResolver(steamCredentialsSchema),
        defaultValues: {
            steamProfileUrl: existingProfileUrl || '',
            username: '',
            password: '',
            consent: false,
        },
    })

    const consentValue = watch('consent')

    const onSubmit = async (data: SteamCredentialsFormData) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/orders/${orderId}/steam-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    steamProfileUrl: data.steamProfileUrl,
                    credentials: {
                        username: data.username,
                        password: data.password,
                    },
                    consent: {
                        given: true,
                        timestamp: new Date().toISOString(),
                        ipAddress: 'client',
                    },
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Erro ao salvar credenciais')
            }

            showSuccess('Sucesso!', 'Credenciais Steam salvas com segurança')
            onSuccess?.()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao salvar credenciais'
            showError('Erro', message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-brand-purple/30">
            <CardHeader>
                <CardTitle className="text-white font-orbitron flex items-center gap-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center">
                        <Lock className="h-5 w-5 text-white" />
                    </div>
                    Credenciais Steam
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Forneça suas credenciais para que o booster possa realizar o serviço. Seus dados são criptografados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <Shield className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="text-green-300 font-medium">Seus dados estão protegidos</p>
                            <p className="text-green-400/80">
                                Utilizamos criptografia AES-256-GCM para proteger suas credenciais. 
                                Apenas o booster designado terá acesso.
                            </p>
                        </div>
                    </div>

                    {/* Steam Profile URL */}
                    <div className="space-y-2">
                        <Label htmlFor="steamProfileUrl" className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Perfil Steam
                        </Label>
                        <Input
                            id="steamProfileUrl"
                            type="url"
                            placeholder="https://steamcommunity.com/id/seuusuario"
                            className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500"
                            {...register('steamProfileUrl')}
                        />
                        {errors.steamProfileUrl && (
                            <p className="text-red-400 text-sm">{errors.steamProfileUrl.message}</p>
                        )}
                    </div>

                    {/* Steam Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Usuário Steam
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Seu usuário de login da Steam"
                            className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500"
                            autoComplete="off"
                            {...register('username')}
                        />
                        {errors.username && (
                            <p className="text-red-400 text-sm">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Steam Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Senha Steam
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Sua senha da Steam"
                                className="bg-black/50 border-brand-purple/30 text-white placeholder:text-gray-500 pr-10"
                                autoComplete="new-password"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-400 text-sm">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Consent Checkbox */}
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-black/30 border border-brand-purple/20">
                        <Checkbox
                            id="consent"
                            checked={consentValue}
                            onCheckedChange={(checked) => setValue('consent', checked === true)}
                            className="mt-1 data-[state=checked]:bg-brand-purple-dark data-[state=checked]:border-brand-purple-dark"
                        />
                        <div className="space-y-1">
                            <Label 
                                htmlFor="consent" 
                                className="text-white cursor-pointer font-rajdhani leading-relaxed"
                                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                            >
                                Concordo em compartilhar minhas credenciais Steam com o booster designado
                            </Label>
                            <p className="text-gray-500 text-xs">
                                As credenciais serão armazenadas de forma criptografada e serão acessíveis apenas pelo booster 
                                responsável pelo seu pedido. Recomendamos alterar sua senha após a conclusão do serviço.
                            </p>
                        </div>
                    </div>
                    {errors.consent && (
                        <p className="text-red-400 text-sm">{errors.consent.message}</p>
                    )}

                    {/* Submit Button */}
                    <ButtonLoading
                        type="submit"
                        loading={loading}
                        disabled={!consentValue}
                        className="w-full bg-gradient-to-r from-brand-purple-dark to-brand-purple-dark hover:from-brand-purple hover:to-brand-purple-dark text-white font-rajdhani"
                        style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                        <Lock className="mr-2 h-4 w-4" />
                        Salvar Credenciais com Segurança
                    </ButtonLoading>
                </form>
            </CardContent>
        </Card>
    )
}
