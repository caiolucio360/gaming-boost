import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify']

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl
        const token = req.nextauth.token

        // Usuário autenticado tentando acessar página de auth → redireciona para seu dashboard
        if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
            if (token) {
                const dest = token.role === 'ADMIN' ? '/admin' : token.role === 'BOOSTER' ? '/booster' : '/dashboard'
                return NextResponse.redirect(new URL(dest, req.url))
            }
            return NextResponse.next()
        }

        // Rotas de admin - apenas ADMIN
        if (pathname.startsWith('/admin')) {
            if (token?.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
        }

        // Rotas de booster - apenas BOOSTER (exceto /booster/apply que CLIENTs podem acessar)
        if (pathname.startsWith('/booster')) {
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
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl
                // Páginas de auth são sempre acessíveis (token não obrigatório)
                if (AUTH_PAGES.some((p) => pathname.startsWith(p))) return true
                // Demais rotas no matcher exigem token
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        // Auth pages — para bloquear acesso de usuários já autenticados
        '/login/:path*',
        '/register/:path*',
        '/forgot-password/:path*',
        '/reset-password/:path*',
        '/verify/:path*',

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
    ],
}
