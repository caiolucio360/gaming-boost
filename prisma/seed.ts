import 'dotenv/config'
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

    // 1. USERS
    console.log('👤 Creating users...')

    const admin = await prisma.user.upsert({
        where: { email: 'admin@gameboost.com' },
        update: {},
        create: {
            email: 'admin@gameboost.com',
            name: 'Admin',
            password: await bcrypt.hash('admin123', 10),
            role: 'ADMIN',
            pixKey: '11999999999',
            adminProfitShare: 0.5,
        },
    })
    console.log('  ✓ Admin:', admin.email)

    const booster = await prisma.user.upsert({
        where: { email: 'booster@gameboost.com' },
        update: {},
        create: {
            email: 'booster@gameboost.com',
            name: 'Booster Pro',
            password: await bcrypt.hash('booster123', 10),
            role: 'BOOSTER',
            pixKey: '11988888888',
            boosterCommissionPercentage: 0.70,
        },
    })
    console.log('  ✓ Booster:', booster.email)

    const client = await prisma.user.upsert({
        where: { email: 'cliente@gameboost.com' },
        update: {},
        create: {
            email: 'cliente@gameboost.com',
            name: 'Cliente',
            password: await bcrypt.hash('cliente123', 10),
            role: 'CLIENT',
        },
    })
    console.log('  ✓ Client:', client.email)

    // 2. BOOSTER PROFILE
    console.log('\n🎮 Creating booster profile...')
    await prisma.boosterProfile.upsert({
        where: { userId: booster.id },
        update: {},
        create: {
            userId: booster.id,
            bio: 'Booster profissional',
            verificationStatus: 'VERIFIED',
            rating: 5.0,
            completedOrders: 0,
        },
    })
    console.log('  ✓ Booster profile created')

    // 3. COMMISSION CONFIG
    console.log('\n💰 Creating commission config...')
    const existingConfig = await prisma.commissionConfig.findFirst({ where: { enabled: true } })
    if (!existingConfig) {
        await prisma.commissionConfig.create({
            data: { boosterPercentage: 0.70, adminPercentage: 0.30, enabled: true },
        })
        console.log('  ✓ Commission: 70% booster / 30% admin')
    } else {
        console.log('  ✓ Commission config exists')
    }

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
            where: { game_gameMode_rangeStart: { game: 'CS2', gameMode: 'PREMIER', rangeStart: r.rangeStart } },
            update: { rangeEnd: r.rangeEnd, price: r.price },
            create: { game: 'CS2', gameMode: 'PREMIER', rangeStart: r.rangeStart, rangeEnd: r.rangeEnd, price: r.price, unit: '1000 pontos', enabled: true },
        })
    }
    console.log('  ✓ Premier pricing (6 ranges)')

    const gcPricing = [
        { rangeStart: 1, rangeEnd: 10, price: 20 },
        { rangeStart: 11, rangeEnd: 14, price: 40 },
        { rangeStart: 15, rangeEnd: 17, price: 50 },
        { rangeStart: 18, rangeEnd: 19, price: 70 },
        { rangeStart: 20, rangeEnd: 20, price: 120 },
    ]

    for (const r of gcPricing) {
        await prisma.pricingConfig.upsert({
            where: { game_gameMode_rangeStart: { game: 'CS2', gameMode: 'GAMERS_CLUB', rangeStart: r.rangeStart } },
            update: { rangeEnd: r.rangeEnd, price: r.price },
            create: { game: 'CS2', gameMode: 'GAMERS_CLUB', rangeStart: r.rangeStart, rangeEnd: r.rangeEnd, price: r.price, unit: '1 nível', enabled: true },
        })
    }
    console.log('  ✓ Gamers Club pricing (5 ranges)')

    // SUMMARY
    console.log('\n' + '='.repeat(50))
    console.log('✅ Seed completed!')
    console.log('='.repeat(50))
    console.log('\n📌 Test accounts:')
    console.log('   Admin:   admin@gameboost.com / admin123')
    console.log('   Booster: booster@gameboost.com / booster123')
    console.log('   Client:  cliente@gameboost.com / cliente123')
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
