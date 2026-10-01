// Buyer requests [05, 06, 06б, 07, 09, 20, 31, 32].
import { useRef } from 'react'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, newIdempotencyKey } from '@/lib/api'
import { directoryKeys, requestKeys } from './keys'
import { cursorPaging } from './pagination'
import type {
	CloseRequestBody,
	CreateRequestBody,
	PartHint,
	RecipientsEstimate,
	Reply,
	RequestDetail,
	RequestStats,
	RequestStatus,
	RequestSummaryPage,
	RequestTarget,
	ReviewTag,
	WidenResult,
} from './types'

// ─── Sending [06, 06б, 31] ───────────────────────────────────────────────────

/** «Колодки», «Стойки», «Фара» — top hints for the car [06]. */
export function useRequestHints(carId: number | undefined, limit = 3) {
	return useQuery({
		queryKey: requestKeys.hints(carId),
		queryFn: ({ signal }) => apiFetch<PartHint[]>('/requests/hints', { query: { carId, limit }, signal }),
		staleTime: 5 * 60_000,
	})
}

export interface EstimateParams {
	carId?: number
	brandId?: number
	target: RequestTarget
	rowIds?: number[]
	containerIds?: number[]
}

/** «Запрос получат 18 продавцов» — recounted on every change of the audience. */
export function useRecipientsEstimate(params: EstimateParams, enabled = true) {
	return useQuery({
		queryKey: requestKeys.estimate(params),
		queryFn: ({ signal }) =>
			apiFetch<RecipientsEstimate>('/requests/estimate', { query: { ...params }, signal }),
		enabled: enabled && Boolean(params.carId ?? params.brandId),
		placeholderData: keepPreviousData,
		staleTime: 15_000,
	})
}

/**
 * POST /requests with `Idempotency-Key`. The key lives until the request is
 * created, so a retry after a dropped connection never creates a duplicate.
 */
export function useCreateRequest() {
	const queryClient = useQueryClient()
	const idempotencyKey = useRef<string | null>(null)

	return useMutation({
		mutationFn: (body: CreateRequestBody) => {
			idempotencyKey.current ??= newIdempotencyKey()
			return apiFetch<RequestDetail>('/requests', { method: 'POST', body, idempotencyKey: idempotencyKey.current })
		},
		onSuccess: (request) => {
			idempotencyKey.current = null
			queryClient.setQueryData(requestKeys.detail(request.id), request)
			queryClient.invalidateQueries({ queryKey: requestKeys.myAll })
		},
	})
}

// ─── Buyer's requests [05, 07, 32] ───────────────────────────────────────────

/** «Мои запросы» [05] — badge comes from `state`. */
export function useMyRequests(status?: RequestStatus) {
	return useInfiniteQuery({
		queryKey: requestKeys.my(status),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<RequestSummaryPage>('/requests/my', { query: { status, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

export function useRequest(id: number) {
	return useQuery({
		queryKey: requestKeys.detail(id),
		queryFn: ({ signal }) => apiFetch<RequestDetail>(`/requests/${id}`, { signal }),
	})
}

/** Only «Есть» answers, oldest first [07]. */
export function useRequestReplies(id: number) {
	return useQuery({
		queryKey: requestKeys.replies(id),
		queryFn: ({ signal }) => apiFetch<Reply[]>(`/requests/${id}/replies`, { signal }),
	})
}

/** Screen 32. Kept live by the `REQUEST_STATS` realtime event (see src/lib/realtime.tsx). */
export function useRequestStats(id: number) {
	return useQuery({
		queryKey: requestKeys.stats(id),
		queryFn: ({ signal }) => apiFetch<RequestStats>(`/requests/${id}/stats`, { signal }),
	})
}

// ─── Actions [09, 20, 32] ────────────────────────────────────────────────────

function useRequestAction<TVariables, TResult>(
	id: number,
	mutationFn: (variables: TVariables) => Promise<TResult>
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: (result) => {
			if (result && typeof result === 'object' && 'state' in result) {
				queryClient.setQueryData(requestKeys.detail(id), result)
			}
			// Detail, replies and stats all changed; the list badge too.
			queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: requestKeys.myAll })
		},
	})
}

/** «Продлить» — 30, 60 or 180 minutes, up to 3 times (409 `EXTEND_LIMIT`). */
export function useExtendRequest(id: number) {
	return useRequestAction(id, (minutes: 30 | 60 | 180) =>
		apiFetch<RequestDetail>(`/requests/${id}/extend`, { method: 'POST', body: { minutes } })
	)
}

/** «Отправить всему рынку» [20, 32]. */
export function useWidenRequest(id: number) {
	return useRequestAction(id, (target: RequestTarget = 'MARKET') =>
		apiFetch<WidenResult>(`/requests/${id}/widen`, { method: 'POST', body: { target } })
	)
}

/** «Купил — закрыть запрос» with an optional review of the shop [09]. */
export function useCloseRequest(id: number) {
	return useRequestAction(id, (body: CloseRequestBody = {}) =>
		apiFetch<RequestDetail>(`/requests/${id}/close`, { method: 'POST', body })
	)
}

/** «Быстро ответил / Деталь как надо / Легко найти бокс» [09]. */
export function useReviewTags() {
	return useQuery({
		queryKey: directoryKeys.reviewTags,
		queryFn: ({ signal }) => apiFetch<ReviewTag[]>('/reviews/tags', { signal }),
		staleTime: Infinity,
	})
}
