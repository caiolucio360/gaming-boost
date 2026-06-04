/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({
  db: {
    pricingConfig: {
      findMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { calculatePremierPrice, calculatePrice } from '@/lib/pricing'
import { Game } from '@/generated/prisma/client'

const mockConfigsRankBoost = [
  { id: 1, rangeStart: 0, rangeEnd: 4999, price: 30, unit: '1000' },
  { id: 2, rangeStart: 5000, rangeEnd: 9999, price: 45, unit: '1000' },
  { id: 3, rangeStart: 10000, rangeEnd: 14999, price: 60, unit: '1000' },
  { id: 4, rangeStart: 15000, rangeEnd: 19999, price: 80, unit: '1000' },
  { id: 5, rangeStart: 20000, rangeEnd: 30000, price: 120, unit: '1000' },
]

const mockConfigsDuoBoost = [
  { id: 6, rangeStart: 0, rangeEnd: 4999, price: 45, unit: '1000' }, // 50% mais caro
  { id: 7, rangeStart: 5000, rangeEnd: 9999, price: 67.5, unit: '1000' },
]

describe('PricingEngine & Core Calculators', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculatePremierPrice (CS2 Premier/Competitivo)', () => {
    it('calculates price correctly within a single tier', async () => {
      ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue(mockConfigsRankBoost)
      const price = await calculatePremierPrice(1000, 2000, 'RANK_BOOST')
      expect(price).toBe(30.00) // (2000 - 1000) / 1000 * 30
      expect(db.pricingConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ serviceType: 'RANK_BOOST' }) })
      )
    })

    it('calculates price correctly across multiple tiers (progressive pricing)', async () => {
      ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue(mockConfigsRankBoost)
      // 4000 to 5000 = 1000 points @ tier 1 (R$30)
      // 5000 to 6000 = 1000 points @ tier 2 (R$45)
      // Total = 75 BRL
      const price = await calculatePremierPrice(4000, 6000, 'RANK_BOOST')
      expect(price).toBe(75.00)
    })

    it('calculates price correctly for partial blocks (e.g. 500 points)', async () => {
      ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue(mockConfigsRankBoost)
      const price = await calculatePremierPrice(1000, 1500, 'RANK_BOOST')
      expect(price).toBe(15.00)
    })

    it('returns 0 if target is less than or equal to current', async () => {
      ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue(mockConfigsRankBoost)
      const price = await calculatePremierPrice(5000, 5000, 'RANK_BOOST')
      expect(price).toBe(0)
    })

    it('throws error if rating exceeds maximum configured range', async () => {
      ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue(mockConfigsRankBoost)
      await expect(calculatePremierPrice(25000, 35000, 'RANK_BOOST'))
        .rejects
        .toThrow('No pricing range found for rating 30001')
    })
  })

  describe('calculatePrice for DUO_BOOST', () => {
    it('uses DUO_BOOST configs from database correctly', async () => {
      ;(db.pricingConfig.findMany as jest.Mock).mockResolvedValue(mockConfigsDuoBoost)
      
      const price = await calculatePrice('CS2' as Game, 'PREMIER', 1000, 2000, 'DUO_BOOST')
      expect(db.pricingConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ serviceType: 'DUO_BOOST' }) })
      )
      expect(price).toBe(45.00) // 1000 points at 45 base
    })
  })
})
