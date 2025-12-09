/**
 * Brazilian document and phone validation/formatting utilities
 * Provides CPF, CNPJ, and phone number handling for Brazilian users
 */

// ============================================
// Phone Number Functions
// ============================================

/**
 * Format phone number to AbacatePay accepted format
 * @param phone - Phone number in any format
 * @returns Formatted phone with +55 country code
 * @example formatPhone('11999999999') => '+5511999999999'
 */
export function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (!digits.startsWith('55')) {
        return `+55${digits}`
    }
    return `+${digits}`
}

/**
 * Validate Brazilian phone number
 * @param phone - Phone number to validate
 * @returns true if valid
 */
export function validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '')

    // 11 digits: 2 area + 9 + 8 number
    if (digits.length === 11) {
        return /^[1-9]{2}9[0-9]{8}$/.test(digits)
    }

    // 13 digits: 55 + 11 digits
    if (digits.length === 13) {
        return /^55[1-9]{2}9[0-9]{8}$/.test(digits)
    }

    return false
}

/**
 * Mask phone number for display ((XX) XXXXX-XXXX)
 */
export function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    const localDigits = digits.startsWith('55') ? digits.substring(2) : digits
    return localDigits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

// ============================================
// CPF/CNPJ Functions
// ============================================

/**
 * Format CPF/CNPJ to numbers only
 * @example formatTaxId('123.456.789-00') => '12345678900'
 */
export function formatTaxId(taxId: string): string {
    return taxId.replace(/\D/g, '')
}

/**
 * Validate Brazilian CPF with check digits
 */
export function validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '')

    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false // All same digits

    // First check digit
    let sum = 0
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit > 9) digit = 0
    if (parseInt(cpf.charAt(9)) !== digit) return false

    // Second check digit
    sum = 0
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit > 9) digit = 0
    if (parseInt(cpf.charAt(10)) !== digit) return false

    return true
}

/**
 * Validate Brazilian CNPJ with check digits
 */
export function validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '')

    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false

    // First check digit
    let sum = 0
    let weight = 2
    for (let i = 11; i >= 0; i--) {
        sum += parseInt(cnpj.charAt(i)) * weight
        weight = weight === 9 ? 2 : weight + 1
    }
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (parseInt(cnpj.charAt(12)) !== digit) return false

    // Second check digit
    sum = 0
    weight = 2
    for (let i = 12; i >= 0; i--) {
        sum += parseInt(cnpj.charAt(i)) * weight
        weight = weight === 9 ? 2 : weight + 1
    }
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (parseInt(cnpj.charAt(13)) !== digit) return false

    return true
}

/**
 * Validate CPF or CNPJ (auto-detect)
 */
export function validateTaxId(taxId: string): boolean {
    const digits = taxId.replace(/\D/g, '')
    if (digits.length === 11) return validateCPF(digits)
    if (digits.length === 14) return validateCNPJ(digits)
    return false
}

/**
 * Mask CPF for display (XXX.XXX.XXX-XX)
 */
export function maskCPF(cpf: string): string {
    const digits = cpf.replace(/\D/g, '')
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Mask CNPJ for display (XX.XXX.XXX/XXXX-XX)
 */
export function maskCNPJ(cnpj: string): string {
    const digits = cnpj.replace(/\D/g, '')
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// ============================================
// Combined Validation
// ============================================

/**
 * Validate user data for payment creation
 */
export function validateUserForPayment(user: {
    name: string | null
    email: string
    taxId: string | null
    phone: string | null
}): { isValid: boolean; error?: string } {
    if (!user.name) {
        return { isValid: false, error: 'Nome é obrigatório' }
    }
    if (!user.email) {
        return { isValid: false, error: 'Email é obrigatório' }
    }
    if (!user.taxId) {
        return { isValid: false, error: 'CPF/CNPJ é obrigatório para pagamentos' }
    }
    if (!validateTaxId(user.taxId)) {
        return { isValid: false, error: 'CPF/CNPJ inválido' }
    }
    if (!user.phone) {
        return { isValid: false, error: 'Telefone é obrigatório para pagamentos' }
    }
    if (!validatePhone(user.phone)) {
        return { isValid: false, error: 'Telefone inválido. Use o formato: (XX) XXXXX-XXXX' }
    }
    return { isValid: true }
}
