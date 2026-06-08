import { calculatePrice } from '@/lib/pricing'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    pricingConfig: {
      findMany: jest.fn(),
    },
  },
}))

describe('Coaching Pricing Calculation', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('calculates flat rate coaching properly', async () => {
    ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue([
      { rangeStart: 1, rangeEnd: 10, price: 50.0 }
    ])

    const total = await calculatePrice('CS2', 'PREMIER', 0, 5, 'COACHING')
    expect(total).toBe(250.0) // 5 hours * 50
  })

  it('calculates volume discount coaching properly', async () => {
    ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue([
      { rangeStart: 1, rangeEnd: 2, price: 50.0 }, // totals of 1-2h priced at 50/h
      { rangeStart: 3, rangeEnd: 5, price: 45.0 }, // totals of 3-5h priced at 45/h
      { rangeStart: 6, rangeEnd: 10, price: 40.0 } // totals of 6-10h priced at 40/h
    ])

    // Volume pricing (lógica B): ALL hours are charged at the rate of the tier
    // the total number of hours falls into — not progressive/marginal.

    // 1 hour → tier [1,2] @ 50 → 50
    let total = await calculatePrice('CS2', 'PREMIER', 0, 1, 'COACHING')
    expect(total).toBe(50.0)

    // 2 hours → tier [1,2] @ 50 → 2 * 50 = 100
    total = await calculatePrice('CS2', 'PREMIER', 0, 2, 'COACHING')
    expect(total).toBe(100.0)

    // 3 hours → tier [3,5] @ 45 → 3 * 45 = 135
    total = await calculatePrice('CS2', 'PREMIER', 0, 3, 'COACHING')
    expect(total).toBe(135.0)

    // 5 hours → tier [3,5] @ 45 → 5 * 45 = 225
    total = await calculatePrice('CS2', 'PREMIER', 0, 5, 'COACHING')
    expect(total).toBe(225.0)

    // 7 hours → tier [6,10] @ 40 → 7 * 40 = 280
    total = await calculatePrice('CS2', 'PREMIER', 0, 7, 'COACHING')
    expect(total).toBe(280.0)
  })

  it('clamps to the last configured tier when hours exceed all ranges', async () => {
    ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue([
      { rangeStart: 1, rangeEnd: 5, price: 50.0 }
    ])

    // 6 hours is above the max configured (5). calculateCoachingPrice applies
    // the last tier's price to all hours: 6 * 50 = 300 (upstream validation in
    // validatePricingRange is what blocks out-of-range requests in real flows).
    const total = await calculatePrice('CS2', 'PREMIER', 0, 6, 'COACHING')
    expect(total).toBe(300.0)
  })
})
