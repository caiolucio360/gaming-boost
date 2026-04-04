/**
 * @jest-environment node
 */
import { z } from 'zod'

// validate.ts imports NextResponse from next/server which requires Web API globals.
// node environment has Response built-in (Node 18+), so we can use it directly.
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}))

import { validateBody, createValidationErrorResponse } from '@/lib/validate'

const TestSchema = z.object({
  name: z.string().min(2),
  age: z.number().positive(),
})

describe('validateBody', () => {
  it('returns success with parsed data for valid input', () => {
    const result = validateBody(TestSchema, { name: 'Jo', age: 25 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Jo')
      expect(result.data.age).toBe(25)
    }
  })

  it('returns failure with errors for invalid input', () => {
    const result = validateBody(TestSchema, { name: 'J', age: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('returns failure for missing required fields', () => {
    const result = validateBody(TestSchema, {})
    expect(result.success).toBe(false)
  })

  it('returns failure for null input', () => {
    const result = validateBody(TestSchema, null)
    expect(result.success).toBe(false)
  })
})

describe('createValidationErrorResponse', () => {
  it('returns a 400 Response', async () => {
    const validation = validateBody(TestSchema, { name: 'J' })
    expect(validation.success).toBe(false)
    if (!validation.success) {
      const response = createValidationErrorResponse(validation.errors)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('message')
      expect(body).toHaveProperty('errors')
    }
  })
})
