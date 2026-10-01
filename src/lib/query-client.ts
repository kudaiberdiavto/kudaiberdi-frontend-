import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

// 4xx are answers, not glitches — retry only network errors and 5xx.
const shouldRetry = (failureCount: number, error: unknown) =>
	failureCount < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500)

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: shouldRetry,
			staleTime: 30_000,
		},
		mutations: {
			retry: false,
		},
	},
})
