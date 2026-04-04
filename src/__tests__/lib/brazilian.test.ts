import { validateCPF, validatePhone, formatPhone, maskPhone, formatTaxId } from '@/lib/brazilian'

describe('validatePhone', () => {
  it('accepts valid 11-digit mobile (with 9)', () => {
    expect(validatePhone('11999999999')).toBe(true)
    expect(validatePhone('21987654321')).toBe(true)
  })
  it('accepts 13-digit with country code 55', () => {
    expect(validatePhone('5511999999999')).toBe(true)
  })
  it('accepts formatted phone (strips non-digits)', () => {
    expect(validatePhone('(11) 99999-9999')).toBe(true)
  })
  it('rejects 10-digit without 9', () => {
    expect(validatePhone('1199999999')).toBe(false)
  })
  it('rejects too short', () => {
    expect(validatePhone('123')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(validatePhone('')).toBe(false)
  })
})

describe('formatPhone', () => {
  it('adds +55 prefix to bare number', () => {
    expect(formatPhone('11999999999')).toBe('+5511999999999')
  })
  it('does not double-add 55 prefix', () => {
    expect(formatPhone('5511999999999')).toBe('+5511999999999')
  })
  it('strips formatting before adding prefix', () => {
    expect(formatPhone('(11) 99999-9999')).toBe('+5511999999999')
  })
})

describe('maskPhone', () => {
  it('formats to (XX) XXXXX-XXXX', () => {
    expect(maskPhone('11999999999')).toBe('(11) 99999-9999')
  })
  it('strips country code before masking', () => {
    expect(maskPhone('5511999999999')).toBe('(11) 99999-9999')
  })
})

describe('validateCPF', () => {
  it('accepts known-valid CPF', () => {
    // Standard test CPF values used in Brazil
    expect(validateCPF('529.982.247-25')).toBe(true)
    expect(validateCPF('52998224725')).toBe(true)
  })
  it('rejects all-same-digit CPF', () => {
    expect(validateCPF('111.111.111-11')).toBe(false)
    expect(validateCPF('000.000.000-00')).toBe(false)
  })
  it('rejects wrong check digits', () => {
    expect(validateCPF('529.982.247-26')).toBe(false)
  })
  it('rejects too short', () => {
    expect(validateCPF('123')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(validateCPF('')).toBe(false)
  })
})

describe('formatTaxId', () => {
  it('strips formatting from CPF', () => {
    expect(formatTaxId('529.982.247-25')).toBe('52998224725')
  })
  it('returns digits-only string unchanged', () => {
    expect(formatTaxId('52998224725')).toBe('52998224725')
  })
})
