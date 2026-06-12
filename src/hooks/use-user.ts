/**
 * React Query hook for User
 * Provides data fetching for current user
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

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
    // requireAuth:false → a 401 (not logged in) must NOT trigger the client's login redirect;
    // React Query surfaces it as an error so `isAuthenticated` resolves to false.
    return api.get<UserResponse>('/api/auth/me', { requireAuth: false })
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
