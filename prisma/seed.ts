import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'
import { getEnabledGames, GAMES_CONFIG } from '../src/lib/games-config'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Hash da senha '123456' para o usuário de teste
  const hashedPassword = await bcrypt.hash('123456', 10)

  // Criar usuário de teste (teste@teste.com)
  const testUser = await prisma.user.upsert({
    where: { email: 'teste@teste.com' },
    update: {},
    create: {
      email: 'teste@teste.com',
      name: 'Usuário de Teste',
      password: hashedPassword,
      role: 'CLIENT',
    },
  })

  console.log('✅ Usuário de teste criado:', testUser.email)

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gameboostpro.com' },
    update: {},
    create: {
      email: 'admin@gameboostpro.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Usuário admin criado:', admin.email)

  // Criar usuário booster de teste
  const boosterPassword = await bcrypt.hash('booster123', 10)
  const booster = await prisma.user.upsert({
    where: { email: 'booster@gameboostpro.com' },
    update: {},
    create: {
      email: 'booster@gameboostpro.com',
      name: 'Booster Pro',
      password: boosterPassword,
      role: 'BOOSTER',
    },
  })

  console.log('✅ Usuário booster criado:', booster.email)

  // Criar alguns clientes adicionais para testes
  const clientPassword = await bcrypt.hash('cliente123', 10)
  const client2 = await prisma.user.upsert({
    where: { email: 'cliente2@teste.com' },
    update: {},
    create: {
      email: 'cliente2@teste.com',
      name: 'Cliente 2',
      password: clientPassword,
      role: 'CLIENT',
    },
  })

  console.log('✅ Usuário cliente 2 criado:', client2.email)

  // Criar serviços dinamicamente baseado nos jogos habilitados
  const enabledGames = getEnabledGames()
  console.log('🎮 Jogos habilitados:', enabledGames.map(g => g.name).join(', '))

  const services = []

  // Para cada jogo habilitado, criar serviços básicos de rank boost
  for (const game of enabledGames) {
    // Criar serviços apenas para os tipos de serviço suportados pelo jogo
    if (game.supportedServiceTypes.includes('RANK_BOOST')) {
      // Serviços padrão para rank boost (podem ser customizados por jogo)
      const gameServices = [
        {
          id: `boost-${game.id.toLowerCase()}-premier-5k-10k`,
          game: game.id as any,
      type: 'RANK_BOOST' as const,
          name: `Boost ${game.displayName} Premier: 5K → 10K`,
          description: `Boost profissional no ${game.name} Premier de 5.000 para 10.000 pontos. Serviço rápido e seguro.`,
          price: 59.90,
      duration: '2-4 dias',
    },
    {
          id: `boost-${game.id.toLowerCase()}-premier-10k-15k`,
          game: game.id as any,
          type: 'RANK_BOOST' as const,
          name: `Boost ${game.displayName} Premier: 10K → 15K`,
          description: `Boost profissional no ${game.name} Premier de 10.000 para 15.000 pontos. Boost garantido.`,
          price: 89.90,
          duration: '3-6 dias',
        },
        {
          id: `boost-${game.id.toLowerCase()}-premier-15k-20k`,
          game: game.id as any,
          type: 'RANK_BOOST' as const,
          name: `Boost ${game.displayName} Premier: 15K → 20K`,
          description: `Boost profissional no ${game.name} Premier de 15.000 para 20.000 pontos. Serviço premium.`,
          price: 129.90,
          duration: '4-7 dias',
        },
        {
          id: `boost-${game.id.toLowerCase()}-premier-20k-25k`,
          game: game.id as any,
      type: 'RANK_BOOST' as const,
          name: `Boost ${game.displayName} Premier: 20K → 25K`,
          description: `Boost profissional no ${game.name} Premier de 20.000 para 25.000 pontos. Para jogadores avançados.`,
          price: 159.90,
          duration: '5-8 dias',
        },
      ]
      services.push(...gameServices)
    }

    // Adicionar outros tipos de serviço se o jogo suportar
    // Exemplo para coaching (se implementado):
    // if (game.supportedServiceTypes.includes('COACHING')) {
    //   services.push({
    //     id: `coaching-${game.id.toLowerCase()}`,
    //     game: game.id as any,
    //     type: 'COACHING' as const,
    //     name: `Coaching ${game.displayName}`,
    //     description: `Sessões de coaching personalizado para ${game.name}`,
    //     price: 99.90,
    //     duration: '1 sessão',
    //   })
    // }
  }

        // Criar serviços no banco de dados
        const createdServices: Array<{ id: string; game: string; type: string; name: string; description: string; price: number; duration: string }> = []
        for (const serviceData of services) {
          try {
            const service = await prisma.service.upsert({
        where: { id: serviceData.id },
        update: {
          // Atualizar dados se o serviço já existir
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
        },
        create: serviceData,
      })
      createdServices.push(service)
      console.log(`✅ Serviço criado: ${service.name} (${service.game})`)
    } catch (error) {
      console.error(`❌ Erro ao criar serviço ${serviceData.id}:`, error)
    }
  }

  console.log(`✅ Total de ${createdServices.length} serviços criados`)

  // Criar alguns pedidos de exemplo
  // IMPORTANTE: Não criar múltiplos pedidos ativos (PENDING ou IN_PROGRESS) da mesma modalidade para o mesmo usuário
  // Respeitar a regra: máximo 1 boost ativo por modalidade por usuário
  const exampleOrders = []
  
  if (createdServices.length >= 4) {
    // testUser: 1 Premier PENDING, 1 Gamers Club COMPLETED
    exampleOrders.push(
      {
        userId: testUser.id,
        serviceId: createdServices[0].id,
        status: 'PENDING' as const,
        total: createdServices[0].price,
        boosterId: null, // Disponível para boosters
        currentRank: '10K',
        targetRank: '15K',
        currentRating: 10000,
        targetRating: 15000,
        gameMode: 'PREMIER',
        gameType: 'CS2_PREMIER',
      },
      {
        userId: testUser.id,
        serviceId: createdServices[2].id,
        status: 'COMPLETED' as const,
        total: createdServices[2].price,
        boosterId: booster.id, // Concluído pelo booster
        currentRank: '5',
        targetRank: '10',
        currentRating: 5,
        targetRating: 10,
        gameMode: 'GAMERS_CLUB',
        gameType: 'CS2_GAMERS_CLUB',
      },
      // client2: 1 Premier PENDING
      {
        userId: client2.id,
        serviceId: createdServices[3].id,
        status: 'PENDING' as const,
        total: createdServices[3].price,
        boosterId: null, // Disponível para boosters
        currentRank: '20K',
        targetRank: '25K',
        currentRating: 20000,
        targetRating: 25000,
        gameMode: 'PREMIER',
        gameType: 'CS2_PREMIER',
      },
      // booster como cliente: 1 Premier IN_PROGRESS
      {
        userId: booster.id,
        serviceId: createdServices[1].id,
        status: 'IN_PROGRESS' as const,
        total: createdServices[1].price,
        boosterId: null, // Não atribuído a si mesmo
        currentRank: '15K',
        targetRank: '20K',
        currentRating: 15000,
        targetRating: 20000,
        gameMode: 'PREMIER',
        gameType: 'CS2_PREMIER',
      }
    )
  } else if (createdServices.length > 0) {
    // Se houver menos de 4 serviços, criar pedidos respeitando a regra
    // testUser: 1 Premier PENDING
    exampleOrders.push({
      userId: testUser.id,
      serviceId: createdServices[0].id,
      status: 'PENDING' as const,
      total: createdServices[0].price,
      boosterId: null,
      currentRank: '10K',
      targetRank: '15K',
      currentRating: 10000,
      targetRating: 15000,
      gameMode: 'PREMIER',
      gameType: 'CS2_PREMIER',
    })
    
    // client2: 1 Premier PENDING (usuário diferente, pode ter)
    if (createdServices.length > 1) {
      exampleOrders.push({
        userId: client2.id,
        serviceId: createdServices[1].id,
        status: 'PENDING' as const,
        total: createdServices[1].price,
        boosterId: null,
        currentRank: '15K',
        targetRank: '20K',
        currentRating: 15000,
        targetRating: 20000,
        gameMode: 'PREMIER',
        gameType: 'CS2_PREMIER',
      })
    }
  }

  // Criar pedidos no banco de dados
  const createdOrders = []
  for (const orderData of exampleOrders) {
    try {
      // Verificar se o pedido já existe (evitar duplicatas)
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: orderData.userId,
          serviceId: orderData.serviceId,
          status: orderData.status,
        },
      })

      if (existingOrder) {
        console.log(`⚠️  Pedido já existe, pulando: ${existingOrder.id}`)
        createdOrders.push(existingOrder)
        continue
      }

      const order = await prisma.order.create({
        data: {
          ...orderData,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Data aleatória dos últimos 7 dias
        },
      })
      createdOrders.push(order)
      const serviceName = createdServices.find(s => s.id === orderData.serviceId)?.name || 'Serviço'
      console.log(`✅ Pedido criado: ${serviceName} (Status: ${order.status})`)
    } catch (error) {
      console.error(`❌ Erro ao criar pedido:`, error)
    }
  }

  console.log(`✅ Total de ${createdOrders.length} pedidos criados`)

  // Criar mais alguns pedidos com diferentes status para melhorar os dados de teste
  // IMPORTANTE: Respeitar a regra - não criar múltiplos pedidos ativos da mesma modalidade para o mesmo usuário
  const additionalOrders = []
  
  if (createdServices.length >= 2) {
    // client2: 1 Gamers Club PENDING (não viola a regra pois client2 não tem Premier ativo)
    additionalOrders.push(
      {
        userId: client2.id,
        serviceId: createdServices[1].id,
        status: 'PENDING' as const,
        total: createdServices[1].price,
        boosterId: null,
        currentRank: '12',
        targetRank: '18',
        currentRating: 12,
        targetRating: 18,
        gameMode: 'GAMERS_CLUB',
        gameType: 'CS2_GAMERS_CLUB',
      }
    )
  }

  // Mais pedidos completos para estatísticas de receita
  // testUser pode ter múltiplos pedidos COMPLETED da mesma modalidade (não há problema)
  if (createdServices.length >= 1) {
    additionalOrders.push(
      {
        userId: testUser.id,
        serviceId: createdServices[0].id,
        status: 'COMPLETED' as const,
        total: createdServices[0].price,
        boosterId: booster.id,
        currentRank: '10K',
        targetRank: '15K',
        currentRating: 10000,
        targetRating: 15000,
        gameMode: 'PREMIER',
        gameType: 'CS2_PREMIER',
      }
    )
  }

  // Criar pedidos adicionais
  for (const orderData of additionalOrders) {
    try {
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: orderData.userId,
          serviceId: orderData.serviceId,
          status: orderData.status,
        },
      })

      if (!existingOrder) {
        const order = await prisma.order.create({
          data: {
            ...orderData,
            createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Últimos 14 dias
          },
        })
        const serviceName = createdServices.find(s => s.id === orderData.serviceId)?.name || 'Serviço'
        console.log(`✅ Pedido adicional criado: ${serviceName} (Status: ${order.status})`)
      }
    } catch (error) {
      console.error(`❌ Erro ao criar pedido adicional:`, error)
    }
  }

  const totalOrders = await prisma.order.count()
  console.log(`✅ Total de ${totalOrders} pedidos no banco`)

  console.log('\n✅ Seed concluído com sucesso!')
  console.log('\n📝 Resumo:')
  console.log(`   - ${enabledGames.length} jogo(s) habilitado(s)`)
  console.log(`   - ${createdServices.length} serviço(s) criado(s)`)
  console.log(`   - ${createdOrders.length} pedido(s) criado(s)`)
  console.log('\n🎮 Jogos configurados:')
  enabledGames.forEach(game => {
    const gameServices = createdServices.filter(s => s.game === game.id)
    console.log(`   - ${game.name}: ${gameServices.length} serviço(s)`)
  })
  console.log('\n👤 Usuários de teste:')
  console.log('   - Cliente: teste@teste.com / 123456')
  console.log('   - Admin: admin@gameboostpro.com / admin123')
  console.log('   - Booster: booster@gameboostpro.com / booster123')
  console.log('   - Cliente 2: cliente2@teste.com / cliente123')
  console.log('\n📊 Resumo final do banco:')
  console.log(`   👥 ${await prisma.user.count()} usuários`)
  console.log(`   📦 ${await prisma.service.count()} serviços`)
  console.log(`   🛒 ${await prisma.order.count()} pedidos`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })