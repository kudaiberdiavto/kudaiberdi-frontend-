// Box stats [17] — last 7 / 30 days, everything counted on the server.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { statsKeys } from './keys'
import type { ShopStats } from './types'

export function useShopStats(period: 'WEEK' | 'MONTH') {
	return useQuery({
		queryKey: statsKeys.shop(period),
		queryFn: ({ signal }) => apiFetch<ShopStats>('/my/shop/stats', { query: { period }, signal }),
		placeholderData: keepPreviousData,
	})
}
