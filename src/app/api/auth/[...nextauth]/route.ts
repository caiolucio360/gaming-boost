import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('Email ou senha incorretos')
        }

        // Verificar se o usuário está ativo
        if (!user.active) {
          throw new Error('Conta desativada. Entre em contato com o suporte.')
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Email ou senha incorretos')
        }

        // Retornar objeto de usuário que será incluído no token JWT
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || undefined,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Na primeira vez que o token é criado (login), incluir dados do usuário
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      // Incluir dados do token na sessão
      if (session.user) {
        session.user.id = parseInt(token.id as string)
        session.user.role = token.role as 'CLIENT' | 'BOOSTER' | 'ADMIN'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

