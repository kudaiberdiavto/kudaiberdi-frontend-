// Seller's incoming requests [11, 12, 14].
import { useRef } from 'react'
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, newIdempotencyKey } from '@/lib/api'
import { incomingKeys } from './keys'
import { cursorPaging, mapPages } from './pagination'
import type { IncomingFilter, IncomingRequest, IncomingRequestPage, Reply, ReplyBody } from './types'

type IncomingData = InfiniteData<IncomingRequestPage>

/** NEW — active without an answer (top of 11), ANSWERED — «Вы ответили «есть»». */
export function useIncomingRequests(filter: IncomingFilter) {
	return useInfiniteQuery({
		queryKey: incomingKeys.list(filter),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<IncomingRequestPage>('/my/shop/requests', { query: { filter, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

export function useIncomingRequest(id: number) {
	return useQuery({
		queryKey: incomingKeys.detail(id),
		queryFn: ({ signal }) => apiFetch<IncomingRequest>(`/my/shop/requests/${id}`, { signal }),
	})
}

/** The seller opened the request — counts as «посмотрели» in the buyer's stats [32]. */
export function useMarkSeen() {
	return useMutation({
		mutationFn: (id: number) => apiFetch<void>(`/my/shop/requests/${id}/seen`, { method: 'POST' }),
	})
}

/**
 * «Есть» / «Нет» with `Idempotency-Key`: the key lives until the answer is
 * accepted, so a retry after a dropped connection never answers twice.
 */
export function useReplyToRequest(id: number) {
	const queryClient = useQueryClient()
	const idempotencyKey = useRef<string | null>(null)

	return useMutation({
		mutationFn: (body: ReplyBody) => {
			idempotencyKey.current ??= newIdempotencyKey()
			return apiFetch<Reply>(`/requests/${id}/replies`, {
				method: 'POST',
				body,
				idempotencyKey: idempotencyKey.current,
			})
		},
		// «Нет» takes the card off «Новые» at once; it comes back if the server says no.
		onMutate: async (body) => {
			if (body.answer !== 'NOT_HAVE') return
			const key = incomingKeys.list('NEW')
			await queryClient.cancelQueries({ queryKey: key })
			const previous = queryClient.getQueryData<IncomingData>(key)
			queryClient.setQueryData<IncomingData>(key, (data) => mapPages(data, (items) => items.filter((item) => item.id !== id)))
			return { key, previous }
		},
		onError: (_, __, context) => {
			if (context) queryClient.setQueryData(context.key, context.previous)
		},
		onSuccess: () => {
			idempotencyKey.current = null
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: incomingKeys.all }),
	})
}
