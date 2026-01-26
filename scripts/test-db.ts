import 'dotenv/config'
import { prisma } from '../src/lib/db'

async function main() {
    console.log('Testing database connection...')
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    try {
        const count = await prisma.pricingConfig.count()
        console.log('PricingConfig count:', count)

        const configs = await prisma.pricingConfig.findMany({ take: 3 })
        console.log('Sample configs:', JSON.stringify(configs, null, 2))
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
