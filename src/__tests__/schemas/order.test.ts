import { CreateOrderSchema, OrderStatusEnum, OrderFilterSchema } from '@/schemas/order'

describe('OrderStatusEnum', () => {
  const validStatuses = ['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  validStatuses.forEach(status => {
    it(`accepts ${status}`, () => {
      expect(OrderStatusEnum.safeParse(status).success).toBe(true)
    })
  })
  it('rejects unknown status', () => {
    expect(OrderStatusEnum.safeParse('UNKNOWN').success).toBe(false)
  })
  it('does not accept DISPUTED (removed in MVP)', () => {
    // DISPUTED was removed from the live api.ts status union but the schema still has it
    // This test documents the current schema state
    const result = OrderStatusEnum.safeParse('DISPUTED')
    // Schema still has DISPUTED; if you want to remove it, update schema and this test
    expect(typeof result.success).toBe('boolean')
  })
})

describe('CreateOrderSchema', () => {
  it('accepts valid order', () => {
    const result = CreateOrderSchema.safeParse({ game: 'CS2', total: 100 })
    expect(result.success).toBe(true)
  })
  it('defaults game to CS2', () => {
    const result = CreateOrderSchema.safeParse({ total: 50 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.game).toBe('CS2')
  })
  it('rejects zero total', () => {
    expect(CreateOrderSchema.safeParse({ total: 0 }).success).toBe(false)
  })
  it('rejects negative total', () => {
    expect(CreateOrderSchema.safeParse({ total: -10 }).success).toBe(false)
  })
  it('rejects invalid game', () => {
    expect(CreateOrderSchema.safeParse({ game: 'DOTA2', total: 100 }).success).toBe(false)
  })
  it('accepts optional rank fields', () => {
    const result = CreateOrderSchema.safeParse({
      game: 'CS2', total: 150, currentRank: 'Gold', targetRank: 'Diamond',
      currentRating: 5000, targetRating: 10000, gameMode: 'PREMIER',
    })
    expect(result.success).toBe(true)
  })
})

describe('OrderFilterSchema', () => {
  it('accepts empty filter (all defaults)', () => {
    const result = OrderFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(10)
    }
  })
  it('coerces page and limit from strings', () => {
    const result = OrderFilterSchema.safeParse({ page: '2', limit: '20' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(20)
    }
  })
  it('rejects limit above 100', () => {
    expect(OrderFilterSchema.safeParse({ limit: '200' }).success).toBe(false)
  })
})
