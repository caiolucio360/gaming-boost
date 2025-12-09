/**
 * React Query hook for User
 * Provides data fetching for current user
 */

'use client'

import { useQuery } from '@tanstack/react-query'

// Types
interface User {
    id: number
    name: string
    email: string
    role: string
    phone?: string
    taxId?: string
}

interface UserResponse {
    user: User
}

// Query Keys
export const userKeys = {
    all: ['user'] as const,
    current: () => [...userKeys.all, 'current'] as const,
}

/**
 * Fetch current user
 */
async function fetchCurrentUser(): Promise<UserResponse> {
    const response = await fetch('/api/auth/me', {
        credentials: 'include',
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao buscar usuário')
    }

    return response.json()
}

/**
 * Hook to fetch current user
 */
export function useUser() {
    const query = useQuery({
        queryKey: userKeys.current(),
        queryFn: fetchCurrentUser,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    return {
        user: query.data?.user,
        isLoading: query.isLoading,
        error: query.error,
        isAuthenticated: !!query.data?.user && !query.error,
        refetch: query.refetch,
    }
}
