import { EmailSchema, MoneySchema, PaginationSchema, IdSchema, OptionalStringSchema } from '@/schemas/common'

describe('EmailSchema', () => {
  it('accepts valid email', () => {
    expect(EmailSchema.safeParse('user@example.com').success).toBe(true)
  })
  it('normalises to lowercase', () => {
    const r = EmailSchema.safeParse('USER@EXAMPLE.COM')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe('user@example.com')
  })
  it('trims whitespace', () => {
    const r = EmailSchema.safeParse('  user@example.com  ')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe('user@example.com')
  })
  it('rejects invalid email', () => {
    expect(EmailSchema.safeParse('notanemail').success).toBe(false)
    expect(EmailSchema.safeParse('missing@').success).toBe(false)
    expect(EmailSchema.safeParse('@nodomain.com').success).toBe(false)
  })
})

describe('MoneySchema', () => {
  it('accepts positive number', () => {
    expect(MoneySchema.safeParse(100).success).toBe(true)
    expect(MoneySchema.safeParse(0.01).success).toBe(true)
  })
  it('rejects zero', () => {
    expect(MoneySchema.safeParse(0).success).toBe(false)
  })
  it('rejects negative', () => {
    expect(MoneySchema.safeParse(-1).success).toBe(false)
  })
})

describe('PaginationSchema', () => {
  it('defaults page=1 limit=10', () => {
    const r = PaginationSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(1)
      expect(r.data.limit).toBe(10)
    }
  })
  it('coerces strings to numbers', () => {
    const r = PaginationSchema.safeParse({ page: '3', limit: '25' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(3)
      expect(r.data.limit).toBe(25)
    }
  })
  it('rejects limit > 100', () => {
    expect(PaginationSchema.safeParse({ limit: 101 }).success).toBe(false)
  })
  it('rejects page < 1', () => {
    expect(PaginationSchema.safeParse({ page: 0 }).success).toBe(false)
  })
})

describe('IdSchema', () => {
  it('accepts string ID', () => {
    const r = IdSchema.safeParse('42')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe('42')
  })
  it('accepts number ID and coerces to string', () => {
    const r = IdSchema.safeParse(42)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe('42')
  })
  it('rejects empty string', () => {
    expect(IdSchema.safeParse('').success).toBe(false)
  })
})

describe('OptionalStringSchema', () => {
  it('returns undefined for empty string', () => {
    const r = OptionalStringSchema.safeParse('')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBeUndefined()
  })
  it('returns value for non-empty string', () => {
    const r = OptionalStringSchema.safeParse('hello')
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe('hello')
  })
  it('returns undefined when omitted', () => {
    const r = OptionalStringSchema.safeParse(undefined)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBeUndefined()
  })
})
