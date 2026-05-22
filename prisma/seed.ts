import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config() // fallback to .env
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const getDirectDatabaseUrl = () => {
    const url = process.env.DATABASE_URL || ''
    return url.replace('-pooler.', '.').replace('&channel_binding=require', '')
}

const adapter = new PrismaPg({ connectionString: getDirectDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding database...\n')

    // 0. CLEANUP — delete all transactional data (preserves PricingConfig)
    console.log('🧹 Cleaning up existing data...')
    await prisma.orderMessage.deleteMany({})
    await prisma.orderChat.deleteMany({})
    await prisma.devAdminRevenue.deleteMany({})
    await prisma.adminRevenue.deleteMany({})
    await prisma.boosterCommission.deleteMany({})
    await prisma.payment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.withdrawal.deleteMany({})
    await prisma.notification.deleteMany({})
    await prisma.verificationCode.deleteMany({})
    await prisma.boosterProfile.deleteMany({})
    await prisma.commissionConfig.deleteMany({})
    // Delete all users except dev.admin
    await prisma.user.deleteMany({
        where: { email: { not: 'dev.admin@gameboost.com' } },
    })
    console.log('  ✓ All data cleared (dev.admin preserved)\n')

    // 1. USERS
    console.log('👤 Creating users...')

    const admin = await prisma.user.create({
        data: {
            email: 'admin@gameboost.com',
            name: 'Admin',
            password: await bcrypt.hash('123456', 10),
            role: 'ADMIN',
            isDevAdmin: false,
            active: true,
            pixKey: '11999999999',
            adminProfitShare: 0.5,
            isTest: false,
        },
    })
    console.log('  ✓ Admin:', admin.email)

    const booster = await prisma.user.create({
        data: {
            email: 'booster@gameboost.com',
            name: 'Booster Pro',
            password: await bcrypt.hash('123456', 10),
            role: 'BOOSTER',
            active: true,
            pixKey: '11988888888',
            isTest: true,
        },
    })
    console.log('  ✓ Booster (test):', booster.email)

    const client = await prisma.user.create({
        data: {
            email: 'cliente@gameboost.com',
            name: 'Cliente Teste',
            password: await bcrypt.hash('123456', 10),
            role: 'CLIENT',
            active: true,
            isTest: true,
        },
    })
    console.log('  ✓ Cliente (test):', client.email)

    const booster2 = await prisma.user.create({
        data: {
            email: 'booster2@gameboost.com',
            name: 'Booster Pro 2',
            password: await bcrypt.hash('123456', 10),
            role: 'BOOSTER',
            active: true,
            pixKey: '11977777770',
            isTest: true,
        },
    })
    console.log('  ✓ Booster2 (test):', booster2.email)

    const client2 = await prisma.user.create({
        data: {
            email: 'cliente2@gameboost.com',
            name: 'Cliente Teste 2',
            password: await bcrypt.hash('123456', 10),
            role: 'CLIENT',
            active: true,
            isTest: true,
        },
    })
    console.log('  ✓ Cliente2 (test):', client2.email)

    // 2. BOOSTER PROFILE
    console.log('\n🎮 Creating booster profiles...')
    await prisma.boosterProfile.create({
        data: {
            userId: booster.id,
            bio: 'Booster profissional',
            verificationStatus: 'VERIFIED',
            completedOrders: 0,
        },
    })
    await prisma.boosterProfile.create({
        data: {
            userId: booster2.id,
            bio: 'Booster profissional 2',
            verificationStatus: 'VERIFIED',
            completedOrders: 0,
        },
    })
    console.log('  ✓ Booster profiles created')

    // 3. COMMISSION CONFIG
    console.log('\n💰 Creating commission config...')
    await prisma.commissionConfig.create({
        data: {
            boosterPercentage: 0.25,
            adminPercentage: 0.75,
            devAdminPercentage: 0.10,
            withdrawalWaitingDays: 7,
            enabled: true,
        },
    })
    console.log('  ✓ Commission: 25% booster / 75% admin / 10% dev-admin (off-the-top)')

    // 4. PRICING CONFIG (CS2)
    console.log('\n📊 Creating pricing configs...')

    const premierPricing = [
        { rangeStart: 0, rangeEnd: 4999, price: 25 },
        { rangeStart: 5000, rangeEnd: 9999, price: 35 },
        { rangeStart: 10000, rangeEnd: 14999, price: 45 },
        { rangeStart: 15000, rangeEnd: 19999, price: 50 },
        { rangeStart: 20000, rangeEnd: 24999, price: 60 },
        { rangeStart: 25000, rangeEnd: 26000, price: 90 },
    ]

    for (const r of premierPricing) {
        await prisma.pricingConfig.upsert({
            where: { game_gameMode_serviceType_rangeStart: { game: 'CS2', gameMode: 'PREMIER', serviceType: 'RANK_BOOST', rangeStart: r.rangeStart } },
            update: { rangeEnd: r.rangeEnd, price: r.price },
            create: { game: 'CS2', gameMode: 'PREMIER', serviceType: 'RANK_BOOST', rangeStart: r.rangeStart, rangeEnd: r.rangeEnd, price: r.price, unit: '1000 pontos', enabled: true },
        })
    }
    console.log('  ✓ Premier Boost pricing (6 ranges)')

    const premierDuoPricing = [
        { rangeStart: 0, rangeEnd: 4999, price: 35 },
        { rangeStart: 5000, rangeEnd: 9999, price: 50 },
        { rangeStart: 10000, rangeEnd: 14999, price: 65 },
        { rangeStart: 15000, rangeEnd: 19999, price: 75 },
        { rangeStart: 20000, rangeEnd: 24999, price: 90 },
        { rangeStart: 25000, rangeEnd: 26000, price: 130 },
    ]

    for (const r of premierDuoPricing) {
        await prisma.pricingConfig.upsert({
            where: { game_gameMode_serviceType_rangeStart: { game: 'CS2', gameMode: 'PREMIER', serviceType: 'DUO_BOOST', rangeStart: r.rangeStart } },
            update: { rangeEnd: r.rangeEnd, price: r.price },
            create: { game: 'CS2', gameMode: 'PREMIER', serviceType: 'DUO_BOOST', rangeStart: r.rangeStart, rangeEnd: r.rangeEnd, price: r.price, unit: '1000 pontos', enabled: true },
        })
    }
    console.log('  ✓ Premier Duo Boost pricing (6 ranges)')

    await prisma.pricingConfig.upsert({
        where: { game_gameMode_serviceType_rangeStart: { game: 'CS2', gameMode: 'PREMIER', serviceType: 'COACHING', rangeStart: 1 } },
        update: { rangeEnd: 10, price: 50.00 },
        create: { game: 'CS2', gameMode: 'PREMIER', serviceType: 'COACHING', rangeStart: 1, rangeEnd: 10, price: 50.00, unit: '1 hora', enabled: true },
    })
    console.log('  ✓ Premier Coaching pricing (1 range, R$50/hora)')

    // SUMMARY
    console.log('\n' + '='.repeat(50))
    console.log('✅ Seed completed!')
    console.log('='.repeat(50))
    console.log('\n📌 Accounts:')
    console.log('   Admin:    admin@gameboost.com / 123456')
    console.log('\n📌 Test accounts (isTest: true — invisible to admin dashboard):')
    console.log('   Booster:  booster@gameboost.com / 123456')
    console.log('   Booster2: booster2@gameboost.com / 123456')
    console.log('   Client:   cliente@gameboost.com / 123456')
    console.log('   Client2:  cliente2@gameboost.com / 123456')
    console.log('\n   (dev.admin@gameboost.com was preserved as-is)')
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
