import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gameboostpro.com' },
    update: {},
    create: {
      email: 'admin@gameboostpro.com',
      name: 'Admin',
      password: '$2a$12$hash', // Hash da senha 'admin123'
      role: 'ADMIN',
    },
  })

  // Criar serviços básicos
  const services = [
    {
      game: 'LOL' as const,
      type: 'RANK_BOOST' as const,
      name: 'Boost de Elo LoL',
      description: 'Boost profissional no League of Legends',
      price: 25.90,
      duration: '1-3 dias',
    },
    {
      game: 'VALORANT' as const,
      type: 'RANK_BOOST' as const,
      name: 'Boost de Rank Valorant',
      description: 'Boost profissional no Valorant',
      price: 35.90,
      duration: '2-4 dias',
    },
    {
      game: 'CS2' as const,
      type: 'RANK_BOOST' as const,
      name: 'Prime Boost CS2',
      description: 'Boost profissional no Counter-Strike 2',
      price: 29.90,
      duration: '2-5 dias',
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.name },
      update: {},
      create: {
        ...service,
        id: service.name.toLowerCase().replace(/\s+/g, '-'),
      },
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })