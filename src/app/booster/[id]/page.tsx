import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Trophy, MessageSquare, CheckCircle2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface BoosterProfilePageProps {
  params: Promise<{
    id: string
  }>
}



export default async function BoosterProfilePage({ params }: BoosterProfilePageProps) {
  // Garantir que params.id é um número válido antes de chamar o banco
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) {
    notFound()
  }

  const profile = await prisma.boosterProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          createdAt: true,
          reviewsReceived: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: { name: true, image: true },
              },
            },
          },
        },
      },
    },
  })

  if (!profile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar className="h-32 w-32 border-4 border-purple-500/50">
            <AvatarImage src={profile.user.image || ''} alt={profile.user.name || 'Booster'} />
            <AvatarFallback className="bg-purple-900/50 text-purple-200 text-2xl">
              {profile.user.name?.substring(0, 2).toUpperCase() || 'BO'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl font-bold text-white font-orbitron">
                  {profile.user.name}
                </h1>
                {profile.verificationStatus === 'VERIFIED' && (
                  <CheckCircle2 className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <p className="text-gray-400 font-rajdhani mt-1">
                Membro desde {formatDate(profile.user.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {profile.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
                  {lang}
                </Badge>
              ))}
            </div>

            <p className="text-gray-300 max-w-2xl font-rajdhani">
              {profile.bio || 'Este booster ainda não adicionou uma biografia.'}
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[200px]">
            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Star className="h-5 w-5 fill-yellow-400" />
                  <span className="font-bold text-xl">{profile.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-400 uppercase font-bold">Avaliação</span>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                  <Trophy className="h-5 w-5" />
                  <span className="font-bold text-xl">{profile.completedOrders}</span>
                </div>
                <span className="text-xs text-gray-400 uppercase font-bold">Pedidos</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white font-orbitron flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-400" />
            Avaliações Recentes
          </h2>

          <div className="grid gap-4">
            {profile.user.reviewsReceived.length > 0 ? (
              profile.user.reviewsReceived.map((review) => (
                <Card key={review.id} className="bg-black/20 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 border border-purple-500/30">
                        <AvatarImage src={review.author.image || ''} />
                        <AvatarFallback className="bg-gray-800 text-gray-400">
                          {review.author.name?.substring(0, 2).toUpperCase() || 'CL'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white">{review.author.name || 'Cliente'}</h4>
                          <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-gray-300 font-rajdhani">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 font-rajdhani">
                Este booster ainda não recebeu avaliações.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
