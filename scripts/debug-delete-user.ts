import dotenv from 'dotenv'
import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// 1. Load Env Vars FIRST
const envPath = path.join(process.cwd(), '.env')
console.log(`Loading env from ${envPath}`)
const result = dotenv.config({ path: envPath })

if (result.error) {
    console.error('Error loading .env:', result.error)
    process.exit(1)
}

// 2. Setup Database Connection (Global)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Starting Service Validation Script...')

    // 3. Dynamic Import of Service (to ensure it uses the loaded env vars if it initializes anything globally)
    // Note: importing src files directly via tsx works
    const { AuthService } = await import('../src/services/auth.service')

    try {
        // TEST CASE A: Delete User with Active Orders (Should Fail)
        console.log('\n[TEST A] User with Active Orders')
        const userA = await prisma.user.create({
            data: {
                name: 'User With Orders',
                email: `test_orders_${Date.now()}@example.com`,
                password: 'password123',
                active: true,
            }
        })
        console.log(`Created User A: ${userA.id}`)

        // Create active order
        await prisma.order.create({
            data: {
                userId: userA.id,
                game: 'CS2',
                status: 'IN_PROGRESS',
                total: 50.0,
                gameMode: 'PREMIER',
                gameType: 'CS2_PREMIER'
            }
        })
        console.log('Created Active Order for User A')

        const resultA = await AuthService.deleteUser(userA.id)
        if (!resultA.success && resultA.code === 'USER_HAS_ACTIVE_ORDERS') {
            console.log('✅ PASS: Correctly blocked deletion due to active orders')
        } else {
            console.error('❌ FAIL: Expected USER_HAS_ACTIVE_ORDERS, got:', resultA)
        }

        // Cleanup A
        await prisma.order.deleteMany({ where: { userId: userA.id } })
        await prisma.user.delete({ where: { id: userA.id } })


        // TEST CASE B: Happy Path (Should Succeed)
        console.log('\n[TEST B] Happy Path')
        const userB = await prisma.user.create({
            data: {
                name: 'User To Delete',
                email: `test_delete_${Date.now()}@example.com`,
                password: 'password123',
                active: true,
            }
        })
        console.log(`Created User B: ${userB.id}`)

        const resultB = await AuthService.deleteUser(userB.id)
        if (resultB.success) {
            console.log('✅ PASS: User deleted successfully')

            // Verify DB state
            const dbUserB = await prisma.user.findUnique({ where: { id: userB.id } })
            if (dbUserB && dbUserB.active === false && dbUserB.email.includes('deleted_')) {
                console.log('✅ PASS: Database record anonymized correctly')
            } else {
                console.error('❌ FAIL: Database record state incorrect:', dbUserB)
            }

        } else {
            console.error('❌ FAIL: Failed to delete user:', resultB)
        }

        // Cleanup B
        if (userB) await prisma.user.delete({ where: { id: userB.id } })

    } catch (error) {
        console.error('Unexpected error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
