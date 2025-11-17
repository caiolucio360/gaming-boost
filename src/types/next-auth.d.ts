import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      email: string
      name?: string | null
      role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  }
}

