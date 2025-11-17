/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import AdminDashboardPage from '@/app/admin/page'

// Mock dos contextos e hooks
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock do fetch
global.fetch = jest.fn()

describe('AdminDashboardPage', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    })
  })

  it('deve redirecionar para login se não estiver autenticado', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('deve redirecionar para dashboard se for CLIENT', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', email: 'client@test.com', role: 'CLIENT' },
      loading: false,
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('deve redirecionar para booster se for BOOSTER', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', email: 'booster@test.com', role: 'BOOSTER' },
      loading: false,
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/booster')
    })
  })

  it('deve mostrar loading enquanto carrega', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' },
      loading: true,
    })

    render(<AdminDashboardPage />)
    // O componente deve mostrar loading
    expect(screen.queryByText('PAINEL ADMINISTRATIVO')).not.toBeInTheDocument()
  })

  it('deve exibir estatísticas quando carregadas com sucesso', async () => {
    const mockStats = {
      users: {
        total: 10,
        clients: 7,
        boosters: 2,
        admins: 1,
      },
      orders: {
        total: 25,
        pending: 5,
        inProgress: 10,
        completed: 8,
        cancelled: 2,
      },
      services: {
        total: 3,
      },
      revenue: {
        total: 5000,
      },
      recentOrders: [
        {
          id: 'order1',
          status: 'PENDING',
          total: 100,
          createdAt: new Date().toISOString(),
          user: { email: 'user@test.com', name: 'User' },
          service: { name: 'Boost CS2', game: 'CS2' },
        },
      ],
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN', name: 'Admin' },
      loading: false,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stats: mockStats }),
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Total de Usuários')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // Total de usuários
      expect(screen.getByText('Total de Pedidos')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument() // Total de pedidos
      expect(screen.getByText('Serviços Disponíveis')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total de serviços
      expect(screen.getByText('Receita Total')).toBeInTheDocument()
    })
  })

  it('deve exibir erro quando falhar ao carregar estatísticas', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' },
      loading: false,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Erro ao buscar estatísticas' }),
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/Erro ao buscar estatísticas/i)).toBeInTheDocument()
      expect(screen.getByText(/Tentar Novamente/i)).toBeInTheDocument()
    })
  })

  it('deve exibir pedidos recentes quando disponíveis', async () => {
    const mockStats = {
      users: { total: 1, clients: 1, boosters: 0, admins: 0 },
      orders: { total: 1, pending: 1, inProgress: 0, completed: 0, cancelled: 0 },
      services: { total: 1 },
      revenue: { total: 100 },
      recentOrders: [
        {
          id: 'order1',
          status: 'PENDING',
          total: 100,
          createdAt: new Date().toISOString(),
          user: { email: 'user@test.com', name: 'User' },
          service: { name: 'Boost CS2 Premier: 10K → 15K', game: 'CS2' },
        },
      ],
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' },
      loading: false,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stats: mockStats }),
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument()
      expect(screen.getByText('Boost CS2 Premier: 10K → 15K')).toBeInTheDocument()
      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })
  })

  it('deve exibir estado vazio quando não houver pedidos recentes', async () => {
    const mockStats = {
      users: { total: 1, clients: 1, boosters: 0, admins: 0 },
      orders: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 },
      services: { total: 0 },
      revenue: { total: 0 },
      recentOrders: [],
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' },
      loading: false,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stats: mockStats }),
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument()
      expect(screen.getByText(/Nenhum pedido encontrado/i)).toBeInTheDocument()
    })
  })

  it('deve formatar preços corretamente', async () => {
    const mockStats = {
      users: { total: 1, clients: 1, boosters: 0, admins: 0 },
      orders: { total: 1, pending: 0, inProgress: 0, completed: 1, cancelled: 0 },
      services: { total: 1 },
      revenue: { total: 1250.5 },
      recentOrders: [],
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' },
      loading: false,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stats: mockStats }),
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      // Verificar se o preço formatado está sendo exibido
      expect(screen.getByText(/R\$/i)).toBeInTheDocument()
    })
  })

  it('deve formatar datas corretamente', async () => {
    const testDate = new Date('2024-01-15T10:30:00Z')
    const mockStats = {
      users: { total: 1, clients: 1, boosters: 0, admins: 0 },
      orders: { total: 1, pending: 1, inProgress: 0, completed: 0, cancelled: 0 },
      services: { total: 1 },
      revenue: { total: 100 },
      recentOrders: [
        {
          id: 'order1',
          status: 'PENDING',
          total: 100,
          createdAt: testDate.toISOString(),
          user: { email: 'user@test.com', name: 'User' },
          service: { name: 'Boost CS2', game: 'CS2' },
        },
      ],
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' },
      loading: false,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stats: mockStats }),
    })

    render(<AdminDashboardPage />)

    await waitFor(() => {
      // Verificar se a data formatada está sendo exibida
      const dateRegex = /\d{2}\/\d{2}\/\d{4}/
      expect(screen.getByText(dateRegex)).toBeInTheDocument()
    })
  })
})

