'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showSuccess, showError } from '@/lib/toast'
import { ButtonLoading } from '@/components/common/button-loading'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { formatDate } from '@/lib/utils'
import { UserCheck, UserX, Clock, CheckCircle2, XCircle, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface BoosterApplication {
    id: number
    bio: string
    languages: string[]
    portfolioUrl?: string
    steamProfileUrl?: string
    steamId?: string
    cs2PremierRating?: number
    cs2Rank?: string
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
    createdAt: string
    user: {
        id: number
        name: string
        email: string
        role: string
    }
}

interface StatusCounts {
    PENDING: number
    VERIFIED: number
    REJECTED: number
}

export default function AdminBoostersPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [applications, setApplications] = useState<BoosterApplication[]>([])
    const [counts, setCounts] = useState<StatusCounts>({ PENDING: 0, VERIFIED: 0, REJECTED: 0 })
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('PENDING')
    const [selectedApp, setSelectedApp] = useState<BoosterApplication | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogAction, setDialogAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED')

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
        } else if (user && user.role !== 'ADMIN') {
            router.replace('/dashboard')
        } else if (user && user.role === 'ADMIN') {
            fetchApplications()
        }
    }, [user, authLoading, router, filter])

    const fetchApplications = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/boosters?status=${filter}`)
            if (!response.ok) throw new Error('Erro ao carregar')
            const data = await response.json()
            setApplications(data.applications)
            setCounts(data.counts)
        } catch (error) {
            showError('Erro', 'Não foi possível carregar as aplicações')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async () => {
        if (!selectedApp) return
        
        setActionLoading(true)
        try {
            const response = await fetch(`/api/admin/boosters/${selectedApp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: dialogAction,
                    reason: dialogAction === 'REJECTED' ? rejectReason : undefined,
                }),
            })

            if (!response.ok) throw new Error('Erro ao processar')

            showSuccess(
                dialogAction === 'VERIFIED' ? 'Aprovado!' : 'Rejeitado',
                dialogAction === 'VERIFIED' 
                    ? 'O usuário agora é um booster' 
                    : 'A aplicação foi rejeitada'
            )
            
            setDialogOpen(false)
            setSelectedApp(null)
            setRejectReason('')
            fetchApplications()
        } catch (error) {
            showError('Erro', 'Não foi possível processar a ação')
        } finally {
            setActionLoading(false)
        }
    }

    const openDialog = (app: BoosterApplication, action: 'VERIFIED' | 'REJECTED') => {
        setSelectedApp(app)
        setDialogAction(action)
        setRejectReason('')
        setDialogOpen(true)
    }

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { label: string; color: string; icon: any }> = {
            PENDING: {
                label: 'Pendente',
                color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                icon: Clock,
            },
            VERIFIED: {
                label: 'Aprovado',
                color: 'bg-green-500/20 text-green-300 border-green-500/50',
                icon: CheckCircle2,
            },
            REJECTED: {
                label: 'Rejeitado',
                color: 'bg-red-500/20 text-red-300 border-red-500/50',
                icon: XCircle,
            },
        }
        const config = configs[status] || configs.PENDING
        const Icon = config.icon
        return (
            <Badge className={`${config.color} border font-rajdhani flex items-center gap-1`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    if (authLoading) {
        return <LoadingSpinner />
    }

    if (!user || user.role !== 'ADMIN') {
        return null
    }

    return (
        <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="max-w-7xl mx-auto">
                {/* Back link */}
                <Link 
                    href="/admin" 
                    className="inline-flex items-center text-gray-400 hover:text-brand-purple-light transition-colors mb-6 font-rajdhani"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Painel
                </Link>

                <PageHeader
                    highlight="APLICAÇÕES"
                    title="DE BOOSTER"
                    description="Gerencie as solicitações para se tornar booster na plataforma."
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                    <div onClick={() => setFilter('PENDING')} className="cursor-pointer">
                        <StatCard
                            title="Pendentes"
                            value={counts.PENDING}
                            description="Aguardando análise"
                            icon={Clock}
                            valueColor={filter === 'PENDING' ? 'text-yellow-300' : undefined}
                        />
                    </div>
                    <div onClick={() => setFilter('VERIFIED')} className="cursor-pointer">
                        <StatCard
                            title="Aprovados"
                            value={counts.VERIFIED}
                            description="Boosters ativos"
                            icon={CheckCircle2}
                            valueColor={filter === 'VERIFIED' ? 'text-green-300' : undefined}
                        />
                    </div>
                    <div onClick={() => setFilter('REJECTED')} className="cursor-pointer">
                        <StatCard
                            title="Rejeitados"
                            value={counts.REJECTED}
                            description="Não aprovados"
                            icon={XCircle}
                            valueColor={filter === 'REJECTED' ? 'text-red-300' : undefined}
                        />
                    </div>
                </div>

                {/* Filter indicator */}
                <div className="mb-4">
                    <Badge className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/50 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        Filtrando: {filter === 'PENDING' ? 'Pendentes' : filter === 'VERIFIED' ? 'Aprovados' : 'Rejeitados'}
                    </Badge>
                </div>

                {/* Applications List */}
                <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
                    <CardHeader>
                        <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Lista de Aplicações
                        </CardTitle>
                        <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {loading ? 'Carregando...' : `${applications.length} aplicação(ões) encontrada(s)`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center">
                                <LoadingSpinner />
                            </div>
                        ) : applications.length === 0 ? (
                            <EmptyState
                                title="Nenhuma aplicação encontrada"
                                description={`Não há aplicações com status "${filter === 'PENDING' ? 'pendente' : filter === 'VERIFIED' ? 'aprovado' : 'rejeitado'}".`}
                                icon={Users}
                            />
                        ) : (
                            <div className="space-y-4">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        className="group p-4 bg-gradient-to-br from-black/50 via-black/40 to-black/50 rounded-lg border border-brand-purple/20 hover:border-brand-purple-light/60 hover:shadow-lg hover:shadow-brand-purple/10 transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-white font-rajdhani font-bold text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                                    {app.user.name || 'Sem nome'}
                                                </h3>
                                                <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                                    {app.user.email}
                                                </p>
                                            </div>
                                            {getStatusBadge(app.verificationStatus)}
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-gray-500 text-xs uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Bio</Label>
                                                <p className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{app.bio}</p>
                                            </div>

                                            {app.steamProfileUrl && (
                                                <div>
                                                    <Label className="text-gray-500 text-xs uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Perfil Steam</Label>
                                                    <p className="text-brand-purple-light font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                                        <a href={app.steamProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {app.steamProfileUrl}
                                                        </a>
                                                    </p>
                                                </div>
                                            )}

                                            {app.cs2PremierRating && (
                                                <div>
                                                    <Label className="text-gray-500 text-xs uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Rating Premier CS2</Label>
                                                    <p className="text-white font-orbitron font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                                        {app.cs2PremierRating.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <Label className="text-gray-500 text-xs uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Idiomas</Label>
                                                    <div className="flex gap-2 mt-1">
                                                        {app.languages?.map((lang) => (
                                                            <Badge key={lang} variant="outline" className="border-brand-purple/30 text-brand-purple-light font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                                                {lang}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-gray-500 text-xs uppercase font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Data</Label>
                                                    <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                                        {formatDate(app.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {app.verificationStatus === 'PENDING' && (
                                            <div className="flex gap-3 pt-4 mt-4 border-t border-brand-purple/20">
                                                <Button
                                                    onClick={() => openDialog(app, 'VERIFIED')}
                                                    className="bg-green-600 hover:bg-green-700 font-rajdhani"
                                                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                                                >
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Aprovar
                                                </Button>
                                                <Button
                                                    onClick={() => openDialog(app, 'REJECTED')}
                                                    variant="destructive"
                                                    className="font-rajdhani"
                                                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                                                >
                                                    <UserX className="h-4 w-4 mr-2" />
                                                    Rejeitar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-brand-black-light border-brand-purple/30">
                    <DialogHeader>
                        <DialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {dialogAction === 'VERIFIED' ? 'Aprovar Booster' : 'Rejeitar Aplicação'}
                        </DialogTitle>
                        <DialogDescription className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {dialogAction === 'VERIFIED' 
                                ? `Você está prestes a aprovar ${selectedApp?.user.name || selectedApp?.user.email} como booster.`
                                : `Você está prestes a rejeitar a aplicação de ${selectedApp?.user.name || selectedApp?.user.email}.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {dialogAction === 'REJECTED' && (
                        <div className="space-y-2">
                            <Label className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Motivo da rejeição (opcional)
                            </Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Explique o motivo..."
                                className="bg-brand-black/50 border-brand-purple/30 text-white font-rajdhani"
                                style={{ fontFamily: 'Rajdhani, sans-serif' }}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDialogOpen(false)}
                            className="font-rajdhani"
                            style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                            Cancelar
                        </Button>
                        <ButtonLoading
                            onClick={handleAction}
                            loading={actionLoading}
                            className={`font-rajdhani ${dialogAction === 'VERIFIED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                            {dialogAction === 'VERIFIED' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
                        </ButtonLoading>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
