import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const contactSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    subject: z.string().min(3, 'Assunto muito curto'),
    message: z.string().min(10, 'Mensagem muito curta'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate input
        const validatedData = contactSchema.parse(body)

        // Get admin email from environment variable
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gameboostpro.com.br'

        // For now, we'll just log the contact form submission
        // In production, you would integrate with an email service like:
        // - Resend
        // - SendGrid
        // - AWS SES
        // - Nodemailer with SMTP

        console.log('📧 New contact form submission:')
        console.log('  From:', validatedData.name, `<${validatedData.email}>`)
        console.log('  Subject:', validatedData.subject)
        console.log('  Message:', validatedData.message)
        console.log('  To:', adminEmail)

        // TODO: Implement actual email sending
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY)
        // await resend.emails.send({
        //   from: 'contato@gameboostpro.com.br',
        //   to: adminEmail,
        //   replyTo: validatedData.email,
        //   subject: `[Contato] ${validatedData.subject}`,
        //   html: `
        //     <h2>Nova mensagem de contato</h2>
        //     <p><strong>Nome:</strong> ${validatedData.name}</p>
        //     <p><strong>Email:</strong> ${validatedData.email}</p>
        //     <p><strong>Assunto:</strong> ${validatedData.subject}</p>
        //     <p><strong>Mensagem:</strong></p>
        //     <p>${validatedData.message}</p>
        //   `,
        // })

        return NextResponse.json({
            success: true,
            message: 'Mensagem enviada com sucesso!'
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Error processing contact form:', error)
        return NextResponse.json(
            { error: 'Erro ao processar mensagem' },
            { status: 500 }
        )
    }
}
