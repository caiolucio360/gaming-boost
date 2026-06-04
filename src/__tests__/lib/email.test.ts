import {
  sendEmail,
  getEmailTemplate,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendWelcomeEmail,
  sendOrderCompletedEmail
} from '@/lib/email'

// Mock global fetch
global.fetch = jest.fn()

describe('Email Service', () => {
  const originalEnv = process.env
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    
    // Clear fetch mock
    ;(global.fetch as jest.Mock).mockClear()

    // Spy on consoles to prevent cluttering test output and to verify graceful degradation
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('sendEmail (Core function)', () => {
    it('should successfully send an email when API key is present', async () => {
      process.env.RESEND_API_KEY = 're_test_123'
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email_123' })
      })

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>'
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer re_test_123',
          'Content-Type': 'application/json'
        })
      }))

      // Check if body was serialized correctly
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      expect(body.to).toBe('test@example.com')
      expect(body.subject).toBe('Test Subject')
      expect(body.html).toBe('<p>Test</p>')
    })

    it('should fallback to console.log in development when API key is missing', async () => {
      delete process.env.RESEND_API_KEY
      process.env.NODE_ENV = 'development'

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Local Test',
        html: '<p>Content</p>'
      })

      // Must return true indicating graceful degradation
      expect(result).toBe(true)
      // Must not call actual fetch
      expect(global.fetch).not.toHaveBeenCalled()
      // Must log to console
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📧 EMAIL WOULD BE SENT:')
    })

    it('should fail and return false when API key is missing in production', async () => {
      delete process.env.RESEND_API_KEY
      process.env.NODE_ENV = 'production'

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Prod Test',
        html: '<p>Content</p>'
      })

      expect(result).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('RESEND_API_KEY not configured')
    })

    it('should catch and handle Resend API errors', async () => {
      process.env.RESEND_API_KEY = 're_test_123'
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid API key' })
      })

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Error Test',
        html: '<p>Content</p>'
      })

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email:', { message: 'Invalid API key' })
    })

    it('should catch network errors thrown by fetch', async () => {
      process.env.RESEND_API_KEY = 're_test_123'
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network offline'))

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Network Error',
        html: '<p>Content</p>'
      })

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending email:', expect.any(Error))
    })
  })

  describe('Template Generators', () => {
    it('getEmailTemplate should wrap content in standard layout', () => {
      const result = getEmailTemplate('<h1>Hello</h1>')
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('FlautasBoost')
      expect(result).toContain('<h1>Hello</h1>')
    })
  })

  describe('Specific Email Senders', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test_123'
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'mock_id' })
      })
    })

    it('sendPasswordResetEmail should format reset link correctly', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://test.com'
      
      await sendPasswordResetEmail('user@test.com', 'token-123')
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      expect(body.subject).toBe('Recuperação de Senha - FlautasBoost')
      expect(body.html).toContain('http://test.com/reset-password?token=token-123')
    })

    it('sendPaymentConfirmationEmail should format currency correctly', async () => {
      await sendPaymentConfirmationEmail('client@test.com', 999, 15000, 'Rank Boost')
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      expect(body.subject).toContain('Pedido #999')
      expect(body.html).toContain('Rank Boost')
      // 15000 cents = R$ 150.00
      expect(body.html).toContain('150.00')
    })

    it('sendWelcomeEmail should customize message based on role', async () => {
      await sendWelcomeEmail('booster@test.com', 'John', 'BOOSTER')
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      expect(body.html).toContain('John')
      expect(body.html).toContain('Bem-vindo ao Time de Boosters!')
      expect(body.html).toContain('Aguarde a aprovação da nossa equipe')
    })

    it('sendOrderCompletedEmail should optionally include retention block', async () => {
      await sendOrderCompletedEmail('client@test.com', 42, 'Duo Boost', {
        currentRating: 15000,
        nextMilestone: 20000,
        progressPct: 50,
        discountPct: 0.1,
        gameMode: 'PREMIER'
      })
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      
      // Should include standard completion text
      expect(body.html).toContain('🎉 Seu Boost Foi Concluído!')
      // Should include retention logic
      expect(body.html).toContain('PRÓXIMO MARCO')
      expect(body.html).toContain('15000')
      expect(body.html).toContain('10% de desconto')
    })
  })
})
