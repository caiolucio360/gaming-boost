import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
const envPath = path.join(process.cwd(), '.env')
console.log(`Loading env from ${envPath}`)
dotenv.config({ path: envPath })

async function main() {
    const apiKey = process.env.RESEND_API_KEY
    const originalFrom = process.env.EMAIL_FROM || 'GameBoost <noreply@gameboost.com.br>'

    // Get email from args
    const toEmail = process.argv[2] ? process.argv[2].trim() : ''

    console.log('\n--- Configuração de Email ---')
    console.log(`API Key encontrada: ${apiKey ? 'Sim (' + apiKey.substring(0, 5) + '...)' : 'Não'}`)
    console.log(`De (original): ${originalFrom}`)
    console.log(`Para: '${toEmail}'`)

    if (!apiKey) {
        console.error('❌ ERRO: RESEND_API_KEY não encontrada no .env')
        process.exit(1)
    }

    if (!toEmail || !toEmail.includes('@')) {
        console.error('\n❌ ERRO: Email de destino inválido ou não fornecido.')
        console.error('USO CORRETO: npx tsx scripts/test-email.ts seu-email@exemplo.com')
        process.exit(1)
    }

    // Helper to send email
    const send = async (from: string, label: string) => {
        console.log(`\nTentativa [${label}]: Enviando de '${from}' para '${toEmail}'...`)

        // Construct payload explicitly to debug structure
        const payload = {
            from: from,
            to: toEmail,
            subject: `Teste de Envio (${label}) - GameBoost`,
            html: '<strong>Se você recebeu isso, o envio de emails está funcionando!</strong>',
        }

        // Log payload preventing sensitive leak if needed, but 'to' is important here
        console.log('Payload:', JSON.stringify(payload, null, 2))

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                console.error(`❌ Falha na tentativa [${label}]:`)
                console.error('Status:', response.status)
                console.error('Erro:', JSON.stringify(data, null, 2))
                return false
            } else {
                console.log(`✅ SUCESSO na tentativa [${label}]!`)
                console.log('ID do Email:', data.id)
                return true
            }
        } catch (error) {
            console.error(`❌ Erro de rede na tentativa [${label}]:`, error)
            return false
        }
    }

    // 1. Try with configured email
    const success = await send(originalFrom, 'Configuração Atual (.env)')

    // 2. If failed, try with Resend default (onboarding) if the error suggests it might help, 
    // or just try it anyway as a fallback diagnostics
    if (!success) {
        console.log('\n⚠️ A tentativa principal falhou. Tentando com dominio de teste do Resend...')
        const fallbackFrom = 'onboarding@resend.dev'
        const successFallback = await send(fallbackFrom, 'Fallback Resend (onboarding)')

        if (successFallback) {
            console.log('\n💡 DIAGNÓSTICO: O envio funcionou com "onboarding@resend.dev", mas falhou com seu domínio.')
            console.log('Isso significa que você precisa configurar/verificar seu domínio no painel do Resend,')
            console.log('OU alterar o EMAIL_FROM no .env para "onboarding@resend.dev" enquanto testa.')
        } else {
            console.log('\n❌ DIAGNÓSTICO: Ambas as tentativas falharam. Verifique sua API Key e se o email de destino é válido.')
            console.log('Nota: Contas gratuitas do Resend só podem enviar para o email do próprio cadastro (se não tiver domínio verificado).')
        }
    }
}

main()
