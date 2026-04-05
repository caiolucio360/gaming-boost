/**
 * Email service using Resend
 * Handles transactional emails for the platform
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using Resend API
 * Uses fetch to avoid installing additional dependencies
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured')
    // In development, just log the email instead of failing
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 EMAIL WOULD BE SENT:')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('Body:', text || html.substring(0, 200))
      console.log('\n')
      return true
    }
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'GameBoost <noreply@gameboost.com.br>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send email:', error)
      return false
    }

    console.log(`✅ Email sent to ${to}: ${subject}`)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Email Templates
 */

export function getEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GameBoost</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #9333ea;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #9333ea;
      text-decoration: none;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #9333ea;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      margin-top: 30px;
      font-size: 12px;
      color: #666;
    }
    .highlight {
      background-color: #f3e8ff;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #9333ea;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gameboost.com.br'}" class="logo">
        GameBoost 🎮
      </a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>GameBoost - Plataforma de Boost Profissional</p>
      <p>Este é um email automático, por favor não responda.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gameboost.com.br'}" style="color: #9333ea;">Acessar Plataforma</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// ============================================================================
// TEMPLATE: Password Reset
// ============================================================================

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  const html = getEmailTemplate(`
    <h2>Recuperação de Senha</h2>
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta GameBoost.</p>
    <div class="highlight">
      <p><strong>Para criar uma nova senha, clique no botão abaixo:</strong></p>
      <a href="${resetUrl}" class="button">Redefinir Senha</a>
    </div>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      <strong>Este link expira em 1 hora.</strong>
    </p>
    <p style="color: #999; font-size: 13px; margin-top: 20px;">
      Se você não solicitou a recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
    </p>
  `)

  return sendEmail({
    to,
    subject: 'Recuperação de Senha - GameBoost',
    html,
  })
}

// ============================================================================
// TEMPLATE: Payment Confirmation
// ============================================================================

export async function sendPaymentConfirmationEmail(
  to: string,
  orderId: number,
  amount: number,
  serviceName: string
): Promise<boolean> {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`

  const html = getEmailTemplate(`
    <h2>✅ Pagamento Confirmado!</h2>
    <p>Olá,</p>
    <p>Seu pagamento foi confirmado com sucesso!</p>
    <div class="highlight">
      <p><strong>Detalhes do Pedido:</strong></p>
      <ul style="list-style: none; padding: 0;">
        <li>📦 Pedido: #${orderId}</li>
        <li>🎮 Serviço: ${serviceName}</li>
        <li>💰 Valor: R$ ${(amount / 100).toFixed(2)}</li>
      </ul>
    </div>
    <p>Seu pedido está aguardando um booster profissional aceitar. Você receberá um email assim que o trabalho for iniciado.</p>
    <a href="${orderUrl}" class="button">Ver Meu Pedido</a>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Em caso de dúvidas, entre em contato com nosso suporte.
    </p>
  `)

  return sendEmail({
    to,
    subject: `Pagamento Confirmado - Pedido #${orderId}`,
    html,
  })
}

// ============================================================================
// TEMPLATE: Order Accepted by Booster
// ============================================================================

export async function sendOrderAcceptedEmail(
  to: string,
  orderId: number,
  serviceName: string,
  boosterName: string
): Promise<boolean> {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`

  const html = getEmailTemplate(`
    <h2>🎯 Seu Boost Foi Iniciado!</h2>
    <p>Olá,</p>
    <p>Ótimas notícias! Um booster profissional aceitou seu pedido e já está trabalhando nele.</p>
    <div class="highlight">
      <p><strong>Detalhes:</strong></p>
      <ul style="list-style: none; padding: 0;">
        <li>📦 Pedido: #${orderId}</li>
        <li>🎮 Serviço: ${serviceName}</li>
        <li>👤 Booster: ${boosterName}</li>
      </ul>
    </div>
    <p>Você pode acompanhar o progresso do seu pedido no painel.</p>
    <a href="${orderUrl}" class="button">Acompanhar Pedido</a>
  `)

  return sendEmail({
    to,
    subject: `Boost Iniciado - Pedido #${orderId}`,
    html,
  })
}

// ============================================================================
// TEMPLATE: Order Completed
// ============================================================================

export async function sendOrderCompletedEmail(
  to: string,
  orderId: number,
  serviceName: string,
  retention?: {
    currentRating: number
    nextMilestone: number | null
    progressPct: number
    discountPct: number
    gameMode: 'PREMIER' | 'GC'
  }
): Promise<boolean> {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const retentionBlock = retention
    ? `
    <div style="margin:24px 0;padding:16px;background:#1A1A1A;border-radius:8px;border:1px solid rgba(124,58,237,0.3)">
      <p style="color:#A855F7;font-size:13px;font-weight:700;margin:0 0 8px">PRÓXIMO MARCO</p>
      ${retention.nextMilestone
        ? `<p style="color:#fff;font-size:14px;margin:0 0 6px">Você está em <strong>${retention.currentRating}</strong> — faltam <strong>${retention.nextMilestone - retention.currentRating}</strong> pts para o próximo marco.</p>
           <div style="background:#374151;border-radius:4px;height:6px;overflow:hidden">
             <div style="background:#7C3AED;height:100%;width:${retention.progressPct}%"></div>
           </div>`
        : `<p style="color:#10B981;font-size:14px;margin:0">🏆 Você chegou ao rating máximo!</p>`
      }
      ${retention.discountPct > 0
        ? `<p style="color:#D1D5DB;font-size:13px;margin:12px 0 0">Você tem <strong style="color:#A855F7">${Math.round(retention.discountPct * 100)}% de desconto</strong> disponível por 48h para o próximo pedido.</p>`
        : `<p style="color:#D1D5DB;font-size:13px;margin:12px 0 0">Complete o próximo boost e ganhe 5% de desconto de fidelidade.</p>`
      }
    </div>
    <div style="text-align:center;margin:20px 0">
      <a href="${appUrl}/games/cs2"
         style="background:#7C3AED;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700">
        ${retention.discountPct > 0 ? 'Garantir meu desconto agora' : 'Continuar subindo'}
      </a>
    </div>
  `
    : ''

  const html = getEmailTemplate(`
    <h2>🎉 Seu Boost Foi Concluído!</h2>
    <p>Olá,</p>
    <p>Parabéns! Seu boost foi finalizado com sucesso!</p>
    <div class="highlight">
      <p><strong>Pedido Concluído:</strong></p>
      <ul style="list-style: none; padding: 0;">
        <li>📦 Pedido: #${orderId}</li>
        <li>🎮 Serviço: ${serviceName}</li>
        <li>✅ Status: Concluído</li>
      </ul>
    </div>
    <p>Esperamos que você esteja satisfeito com o serviço! Que tal deixar uma avaliação para o booster?</p>
    <a href="${orderUrl}" class="button">Avaliar Serviço</a>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Obrigado por escolher a GameBoost! 🚀
    </p>
    ${retentionBlock}
  `)

  return sendEmail({
    to,
    subject: `Boost Concluído - Pedido #${orderId}`,
    html,
  })
}

// ============================================================================
// TEMPLATE: New Order Available (Booster)
// ============================================================================

export async function sendNewOrderAvailableEmail(
  to: string,
  orderId: number,
  serviceName: string,
  commission: number
): Promise<boolean> {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booster`

  const html = getEmailTemplate(`
    <h2>💼 Novo Pedido Disponível!</h2>
    <p>Olá Booster,</p>
    <p>Um novo pedido está disponível para você aceitar!</p>
    <div class="highlight">
      <p><strong>Detalhes do Pedido:</strong></p>
      <ul style="list-style: none; padding: 0;">
        <li>📦 Pedido: #${orderId}</li>
        <li>🎮 Serviço: ${serviceName}</li>
        <li>💰 Sua comissão: R$ ${commission.toFixed(2)}</li>
      </ul>
    </div>
    <p>Acesse seu painel de booster para aceitar este pedido antes que outro booster pegue!</p>
    <a href="${orderUrl}" class="button">Ver Pedido</a>
  `)

  return sendEmail({
    to,
    subject: `Novo Pedido Disponível - #${orderId}`,
    html,
  })
}

// ============================================================================
// TEMPLATE: Welcome Email
// ============================================================================

export async function sendWelcomeEmail(to: string, name: string, role: string): Promise<boolean> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`

  const roleMessages = {
    CLIENT: {
      title: 'Bem-vindo à GameBoost!',
      message: 'Você está pronto para subir de rank! Explore nossos serviços de boost profissional e escolha o que melhor se encaixa no seu objetivo.',
      cta: 'Explorar Serviços',
    },
    BOOSTER: {
      title: 'Bem-vindo ao Time de Boosters!',
      message: 'Sua conta foi criada com sucesso. Aguarde a aprovação da nossa equipe para começar a aceitar pedidos e ganhar dinheiro fazendo o que você ama!',
      cta: 'Acessar Painel',
    },
    ADMIN: {
      title: 'Bem-vindo à Administração!',
      message: 'Você agora tem acesso ao painel administrativo da plataforma.',
      cta: 'Acessar Admin',
    },
  }

  const roleMessage = roleMessages[role as keyof typeof roleMessages] || roleMessages.CLIENT

  const html = getEmailTemplate(`
    <h2>${roleMessage.title}</h2>
    <p>Olá ${name},</p>
    <p>${roleMessage.message}</p>
    <a href="${dashboardUrl}" class="button">${roleMessage.cta}</a>
    <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Dica:</strong> Mantenha suas informações de perfil atualizadas para melhor experiência na plataforma.
      </p>
    </div>
  `)

  return sendEmail({
    to,
    subject: 'Bem-vindo à GameBoost! 🎮',
    html,
  })
}

// ============================================================================
// TEMPLATE: Order Cancelled
// ============================================================================

export async function sendOrderCancelledEmail(
  to: string,
  orderId: number,
  serviceName: string,
  refundAmount: number
): Promise<boolean> {
  const html = getEmailTemplate(`
    <h2>Pedido Cancelado</h2>
    <p>Olá,</p>
    <p>Seu pedido foi cancelado conforme solicitado.</p>
    <div class="highlight">
      <p><strong>Detalhes:</strong></p>
      <ul style="list-style: none; padding: 0;">
        <li>📦 Pedido: #${orderId}</li>
        <li>🎮 Serviço: ${serviceName}</li>
        <li>💰 Valor reembolsado: R$ ${(refundAmount / 100).toFixed(2)}</li>
      </ul>
    </div>
    <p>O reembolso será processado e o valor retornará para sua conta em até 5 dias úteis.</p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Esperamos vê-lo novamente em breve!
    </p>
  `)

  return sendEmail({
    to,
    subject: `Pedido Cancelado - #${orderId}`,
    html,
  })
}

// ============================================================================
// TEMPLATE: Reactivation (retention campaign)
// ============================================================================

export async function sendReactivationEmail(
  to: string,
  data: {
    currentRating: number
    currentRatingLabel: string
    nextMilestone: number
    nextMilestoneLabel: string
    discountPct: number
    discountExpiresAt: Date
  }
): Promise<boolean> {
  const discountLabel = Math.round(data.discountPct * 100)
  const expiresFormatted = data.discountExpiresAt.toLocaleDateString('pt-BR')
  const gap = data.nextMilestone - data.currentRating
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const subject = `Seus rivais estão subindo. Você parou em ${data.currentRatingLabel}.`

  const html = `<!DOCTYPE html>
<html>
<body style="background:#0A0A0A;color:#fff;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
  <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">
    Seus rivais estão subindo. Você parou em ${data.currentRatingLabel}.
  </h1>
  <p style="color:#9CA3AF;font-size:14px;line-height:1.6">
    Você parou em ${data.currentRatingLabel} há 14 dias. Faltam só <strong style="color:#fff">${gap}</strong> para ${data.nextMilestoneLabel}.
  </p>
  <div style="margin:24px 0;padding:16px;background:#1A1A1A;border-radius:8px;border:1px solid rgba(124,58,237,0.3)">
    <p style="color:#A855F7;font-weight:700;margin:0 0 8px;font-size:13px">OFERTA ESPECIAL</p>
    <p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 4px">${discountLabel}% de desconto</p>
    <p style="color:#9CA3AF;font-size:13px;margin:0">Válido até ${expiresFormatted}</p>
  </div>
  <div style="text-align:center;margin:20px 0">
    <a href="${appUrl}/games/cs2"
       style="background:#7C3AED;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700">
      Garantir meu desconto agora
    </a>
  </div>
</body>
</html>`

  const text = `Você parou em ${data.currentRatingLabel} há 14 dias. Faltam só ${gap} para ${data.nextMilestoneLabel}. Garanta ${discountLabel}% de desconto em: ${appUrl}/games/cs2`

  return sendEmail({
    to,
    subject,
    html,
    text,
  })
}
