import { RegisterSchema, LoginSchema, UpdateProfileSchema } from '@/schemas/auth'

describe('RegisterSchema', () => {
  it('accepts valid input', () => {
    expect(RegisterSchema.safeParse({ name: 'João Silva', email: 'joao@example.com', password: 'senha123' }).success).toBe(true)
  })
  it('rejects name shorter than 2 chars', () => {
    expect(RegisterSchema.safeParse({ name: 'J', email: 'j@example.com', password: 'senha123' }).success).toBe(false)
  })
  it('rejects empty name', () => {
    expect(RegisterSchema.safeParse({ name: '', email: 'j@example.com', password: 'senha123' }).success).toBe(false)
  })
  it('rejects invalid email', () => {
    expect(RegisterSchema.safeParse({ name: 'João', email: 'not-an-email', password: 'senha123' }).success).toBe(false)
  })
  it('rejects password shorter than 6 chars', () => {
    expect(RegisterSchema.safeParse({ name: 'João', email: 'j@example.com', password: '123' }).success).toBe(false)
  })
  it('normalises email to lowercase', () => {
    const r = RegisterSchema.safeParse({ name: 'João', email: 'JOAO@EXAMPLE.COM', password: 'senha123' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('joao@example.com')
  })
})

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    expect(LoginSchema.safeParse({ email: 'user@example.com', password: 'any' }).success).toBe(true)
  })
  it('rejects empty password', () => {
    expect(LoginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })
  it('rejects invalid email', () => {
    expect(LoginSchema.safeParse({ email: 'notanemail', password: 'pass' }).success).toBe(false)
  })
})

describe('UpdateProfileSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(UpdateProfileSchema.safeParse({}).success).toBe(true)
  })
  it('accepts valid name', () => {
    expect(UpdateProfileSchema.safeParse({ name: 'Maria' }).success).toBe(true)
  })
  it('rejects name shorter than 2 chars', () => {
    expect(UpdateProfileSchema.safeParse({ name: 'X' }).success).toBe(false)
  })
  it('accepts valid 11-digit phone', () => {
    expect(UpdateProfileSchema.safeParse({ phone: '11999999999' }).success).toBe(true)
  })
  it('rejects short phone', () => {
    expect(UpdateProfileSchema.safeParse({ phone: '123' }).success).toBe(false)
  })
})
