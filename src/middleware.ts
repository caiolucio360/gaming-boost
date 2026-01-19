import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl
        const token = req.nextauth.token

        // Rotas de admin - apenas ADMIN
        if (pathname.startsWith('/admin')) {
            if (token?.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
        }

        // Rotas de booster - apenas BOOSTER (exceto /booster/apply que CLIENTs podem acessar)
        if (pathname.startsWith('/booster')) {
            // Allow CLIENT users to access the apply page
            if (pathname === '/booster/apply') {
                if (token?.role !== 'CLIENT' && token?.role !== 'BOOSTER' && token?.role !== 'ADMIN') {
                    return NextResponse.redirect(new URL('/dashboard', req.url))
                }
            } else if (token?.role !== 'BOOSTER' && token?.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            // Retorna true se o usuário está autenticado
            authorized: ({ token }) => !!token,
        },
    }
)

// Definir quais rotas o middleware deve proteger
export const config = {
    matcher: [
        // Dashboard e perfil do cliente
        '/dashboard/:path*',
        '/profile/:path*',

        // Carrinho e pagamento
        '/cart/:path*',
        '/payment/:path*',

        // Notificações
        '/notifications/:path*',

        // Área do booster
        '/booster/:path*',

        // Área do admin
        '/admin/:path*',

        // Disputas
        '/disputes/:path*',
    ],
}
