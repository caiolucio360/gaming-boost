import { z } from 'zod'
import { validateBody, createValidationErrorResponse } from '@/lib/validate'

const TestSchema = z.object({
  name: z.string().min(2),
  age: z.number().positive(),
})

describe('validateBody', () => {
  it('returns success with parsed data for valid input', () => {
    const result = validateBody({ name: 'Jo', age: 25 }, TestSchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Jo')
      expect(result.data.age).toBe(25)
    }
  })

  it('returns failure with errors for invalid input', () => {
    const result = validateBody({ name: 'J', age: -1 }, TestSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })

  it('returns failure for missing required fields', () => {
    const result = validateBody({}, TestSchema)
    expect(result.success).toBe(false)
  })

  it('returns failure for null input', () => {
    const result = validateBody(null, TestSchema)
    expect(result.success).toBe(false)
  })
})

describe('createValidationErrorResponse', () => {
  it('returns a 400 Response', async () => {
    const validation = validateBody({ name: 'J' }, TestSchema)
    expect(validation.success).toBe(false)
    if (!validation.success) {
      const response = createValidationErrorResponse(validation.error)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('message')
      expect(body).toHaveProperty('errors')
    }
  })
})
