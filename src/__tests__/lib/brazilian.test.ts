/**
 * Tests for Brazilian validation helpers
 * TDD: Testing CPF, CNPJ, phone validation and formatting
 */

import {
    formatPhone,
    validatePhone,
    maskPhone,
    formatTaxId,
    validateCPF,
    validateCNPJ,
    validateTaxId,
    maskCPF,
    maskCNPJ,
    validateUserForPayment,
} from '@/lib/brazilian'

describe('Brazilian Helpers', () => {
    describe('Phone Functions', () => {
        describe('formatPhone', () => {
            it('should add +55 prefix to phone without country code', () => {
                expect(formatPhone('11999998888')).toBe('+5511999998888')
            })

            it('should keep +55 prefix if already present', () => {
                expect(formatPhone('5511999998888')).toBe('+5511999998888')
            })

            it('should remove formatting and add prefix', () => {
                expect(formatPhone('(11) 99999-8888')).toBe('+5511999998888')
            })
        })

        describe('validatePhone', () => {
            it('should validate 11-digit mobile phone', () => {
                expect(validatePhone('11999998888')).toBe(true)
            })

            it('should validate formatted phone', () => {
                expect(validatePhone('(11) 99999-8888')).toBe(true)
            })

            it('should validate phone with country code', () => {
                expect(validatePhone('5511999998888')).toBe(true)
            })

            it('should reject invalid phone', () => {
                expect(validatePhone('1234567')).toBe(false)
            })

            it('should reject landline (not starting with 9)', () => {
                expect(validatePhone('1133334444')).toBe(false)
            })
        })

        describe('maskPhone', () => {
            it('should mask phone correctly', () => {
                expect(maskPhone('11999998888')).toBe('(11) 99999-8888')
            })

            it('should handle phone with country code', () => {
                expect(maskPhone('5511999998888')).toBe('(11) 99999-8888')
            })
        })
    })

    describe('CPF/CNPJ Functions', () => {
        describe('formatTaxId', () => {
            it('should remove formatting from CPF', () => {
                expect(formatTaxId('123.456.789-09')).toBe('12345678909')
            })

            it('should remove formatting from CNPJ', () => {
                expect(formatTaxId('12.345.678/0001-95')).toBe('12345678000195')
            })
        })

        describe('validateCPF', () => {
            it('should validate a valid CPF', () => {
                expect(validateCPF('52998224725')).toBe(true)
            })

            it('should validate formatted CPF', () => {
                expect(validateCPF('529.982.247-25')).toBe(true)
            })

            it('should reject CPF with wrong check digits', () => {
                expect(validateCPF('12345678900')).toBe(false)
            })

            it('should reject CPF with all same digits', () => {
                expect(validateCPF('11111111111')).toBe(false)
            })

            it('should reject CPF with wrong length', () => {
                expect(validateCPF('1234567890')).toBe(false)
            })
        })

        describe('validateCNPJ', () => {
            it('should validate a valid CNPJ', () => {
                expect(validateCNPJ('11222333000181')).toBe(true)
            })

            it('should validate formatted CNPJ', () => {
                expect(validateCNPJ('11.222.333/0001-81')).toBe(true)
            })

            it('should reject CNPJ with wrong check digits', () => {
                expect(validateCNPJ('12345678000100')).toBe(false)
            })

            it('should reject CNPJ with all same digits', () => {
                expect(validateCNPJ('11111111111111')).toBe(false)
            })
        })

        describe('validateTaxId', () => {
            it('should auto-detect and validate CPF', () => {
                expect(validateTaxId('52998224725')).toBe(true)
            })

            it('should auto-detect and validate CNPJ', () => {
                expect(validateTaxId('11222333000181')).toBe(true)
            })

            it('should reject invalid length', () => {
                expect(validateTaxId('12345')).toBe(false)
            })
        })

        describe('maskCPF', () => {
            it('should mask CPF correctly', () => {
                expect(maskCPF('52998224725')).toBe('529.982.247-25')
            })
        })

        describe('maskCNPJ', () => {
            it('should mask CNPJ correctly', () => {
                expect(maskCNPJ('11222333000181')).toBe('11.222.333/0001-81')
            })
        })
    })

    describe('validateUserForPayment', () => {
        it('should validate complete user data', () => {
            const result = validateUserForPayment({
                name: 'João Silva',
                email: 'joao@example.com',
                taxId: '52998224725',
                phone: '11999998888',
            })
            expect(result.isValid).toBe(true)
        })

        it('should reject missing name', () => {
            const result = validateUserForPayment({
                name: null,
                email: 'joao@example.com',
                taxId: '52998224725',
                phone: '11999998888',
            })
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('Nome')
        })

        it('should reject invalid CPF', () => {
            const result = validateUserForPayment({
                name: 'João',
                email: 'joao@example.com',
                taxId: '12345678900',
                phone: '11999998888',
            })
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('inválido')
        })
    })
})
