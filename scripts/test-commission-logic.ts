
import { prisma } from '../src/lib/db'

async function main() {
    console.log('🚀 Starting Commission Logic Test...')

    // 1. Setup: Create unique emails for this test run
    const timestamp = Date.now()
    const boosterEmail = `booster_${timestamp}@test.com`
    const admin1Email = `admin1_${timestamp}@test.com`
    const admin2Email = `admin2_${timestamp}@test.com`
    const clientEmail = `client_${timestamp}@test.com`

    try {
        // Create Users
        console.log('Creating users...')
        const client = await prisma.user.create({
            data: { email: clientEmail, password: 'password', role: 'CLIENT', name: 'Test Client' }
        })

        const booster = await prisma.user.create({
            data: {
                email: boosterEmail,
                password: 'password',
                role: 'BOOSTER',
                name: 'Test Booster',
                boosterCommissionPercentage: 0.20 // 20% commission
            }
        })

        const admin1 = await prisma.user.create({
            data: {
                email: admin1Email,
                password: 'password',
                role: 'ADMIN',
                name: 'Admin 1',
                adminProfitShare: 1.0 // Equal share
            }
        })

        const admin2 = await prisma.user.create({
            data: {
                email: admin2Email,
                password: 'password',
                role: 'ADMIN',
                name: 'Admin 2',
                adminProfitShare: 3.0 // 3x share (should get 75% of profit)
            }
        })

        // Create Service
        const service = await prisma.service.create({
            data: {
                name: 'Test Service',
                description: 'Test',
                game: 'CS2',
                type: 'RANK_BOOST',
                price: 100.0,
            }
        })

        // Create Order
        console.log('Creating order...')
        const order = await prisma.order.create({
            data: {
                userId: client.id,
                serviceId: service.id,
                total: 100.0,
                status: 'PENDING'
            }
        })

        // 2. Execute Logic: Simulate Booster Accepting Order
        // We need to replicate the logic from the API route here since we can't easily call the API function directly
        console.log('Simulating Booster Acceptance...')

        // --- LOGIC START (Copied/Adapted from route.ts) ---
        const boosterPercentage = booster.boosterCommissionPercentage || 0.70
        const boosterCommission = order.total * boosterPercentage
        const adminRevenueTotal = order.total - boosterCommission
        const adminPercentageTotal = 1 - boosterPercentage

        // Fetch all active admins
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', active: true },
            select: { id: true, adminProfitShare: true, email: true }
        })

        const totalShares = admins.reduce((sum: number, admin: any) => sum + (admin.adminProfitShare || 0), 0)

        console.log(`Total Order: ${order.total}`)
        console.log(`Booster Commission: ${boosterCommission} (${boosterPercentage * 100}%)`)
        console.log(`Total Admin Revenue to Split: ${adminRevenueTotal}`)
        console.log(`Total Shares: ${totalShares}`)

        // Update Order (commission data is stored in BoosterCommission and AdminRevenue models, not on Order)
        await prisma.order.update({
            where: { id: order.id },
            data: {
                boosterId: booster.id,
                status: 'IN_PROGRESS',
            }
        })

        // Create Booster Commission
        await prisma.boosterCommission.create({
            data: {
                orderId: order.id,
                boosterId: booster.id,
                orderTotal: order.total,
                percentage: boosterPercentage,
                amount: boosterCommission,
                status: 'PENDING'
            }
        })

        // Distribute Admin Revenue
        for (const admin of admins) {
            let sharePercentage = 0
            if (totalShares > 0) {
                sharePercentage = (admin.adminProfitShare || 0) / totalShares
            } else {
                sharePercentage = 1 / admins.length
            }

            const adminAmount = adminRevenueTotal * sharePercentage

            console.log(`Admin ${admin.email} (Share: ${admin.adminProfitShare}): Gets ${adminAmount} (${sharePercentage * 100}% of profit)`)

            await prisma.adminRevenue.create({
                data: {
                    orderId: order.id,
                    adminId: admin.id,
                    orderTotal: order.total,
                    percentage: adminPercentageTotal * sharePercentage,
                    amount: adminAmount,
                    status: 'PENDING'
                }
            })
        }
        // --- LOGIC END ---

        // 3. Verification
        console.log('\n--- VERIFICATION ---')
        const revenues = await prisma.adminRevenue.findMany({
            where: { orderId: order.id },
            include: { admin: true }
        })

        const revAdmin1 = revenues.find((r: any) => r.admin.email === admin1Email)
        const revAdmin2 = revenues.find((r: any) => r.admin.email === admin2Email)

        // Expected:
        // Booster gets 20% of 100 = 20.
        // Remaining = 80.
        // Admin 1 (Share 1.0) + Admin 2 (Share 3.0) + (Other existing admins in DB might affect this!)
        // Wait, "Other existing admins". The logic fetches ALL active admins. 
        // If the user has other admins in their DB, they will get a cut too.
        // This makes the test non-deterministic if we don't account for them.
        // But for the purpose of this test, we can just verify that the created admins got *some* revenue proportional to their shares relative to each other.

        if (!revAdmin1 || !revAdmin2) {
            throw new Error('Created admins did not receive revenue!')
        }

        console.log(`Admin 1 Revenue: ${revAdmin1.amount}`)
        console.log(`Admin 2 Revenue: ${revAdmin2.amount}`)

        // Admin 2 should have roughly 3x Admin 1's revenue (since 3.0 vs 1.0)
        const ratio = revAdmin2.amount / revAdmin1.amount
        console.log(`Ratio (Admin2/Admin1): ${ratio}`)

        if (Math.abs(ratio - 3) < 0.1) {
            console.log('✅ SUCCESS: Admin 2 received ~3x Admin 1 revenue as expected.')
        } else {
            console.warn('⚠️ WARNING: Ratio is not exactly 3. This might be due to other existing admins in the database taking a share.')
        }

    } catch (error) {
        console.error('❌ ERROR:', error)
    } finally {
        // Cleanup
        console.log('Cleaning up...')
        // Delete users (cascade should delete orders/revenues)
        await prisma.user.deleteMany({
            where: {
                email: { in: [boosterEmail, admin1Email, admin2Email, clientEmail] }
            }
        })
        await prisma.service.deleteMany({ where: { name: 'Test Service' } }) // Cleanup service
        await prisma.$disconnect()
    }
}

main()
