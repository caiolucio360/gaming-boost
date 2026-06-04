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

  it('calculates progressive discount coaching properly', async () => {
    ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue([
      { rangeStart: 1, rangeEnd: 2, price: 50.0 }, // First 2 hours are 50
      { rangeStart: 3, rangeEnd: 5, price: 45.0 }, // Hours 3 to 5 are 45
      { rangeStart: 6, rangeEnd: 10, price: 40.0 } // Hours 6 to 10 are 40
    ])

    // Buy 1 hour
    let total = await calculatePrice('CS2', 'PREMIER', 0, 1, 'COACHING')
    expect(total).toBe(50.0)

    // Buy 2 hours
    total = await calculatePrice('CS2', 'PREMIER', 0, 2, 'COACHING')
    expect(total).toBe(100.0)

    // Buy 3 hours (2 hours at 50, 1 hour at 45 = 100 + 45 = 145)
    total = await calculatePrice('CS2', 'PREMIER', 0, 3, 'COACHING')
    expect(total).toBe(145.0)

    // Buy 5 hours (2 at 50, 3 at 45 = 100 + 135 = 235)
    total = await calculatePrice('CS2', 'PREMIER', 0, 5, 'COACHING')
    expect(total).toBe(235.0)

    // Buy 7 hours (2 at 50, 3 at 45, 2 at 40 = 100 + 135 + 80 = 315)
    total = await calculatePrice('CS2', 'PREMIER', 0, 7, 'COACHING')
    expect(total).toBe(315.0)
  })

  it('throws if requested hours exceed configured ranges', async () => {
    ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue([
      { rangeStart: 1, rangeEnd: 5, price: 50.0 }
    ])

    await expect(
      calculatePrice('CS2', 'PREMIER', 0, 6, 'COACHING')
    ).rejects.toThrow('Sem configuração de preço acima de 5 horas')
  })
})
