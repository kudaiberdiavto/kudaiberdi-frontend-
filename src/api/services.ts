// Service requests [16, 17] and the master side [18–20] — contract sections 12 and 13.5.
import { useRef } from 'react'
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch, newIdempotencyKey } from '@/lib/api'
import { useSession } from '@/store/useSession'
import { BUNDLED_SERVICE_TYPES, SERVICE_SHORT } from '@/data/service-types'
import { masterKeys, meKeys, serviceKeys } from './keys'
import { cursorPaging, mapPages } from './pagination'
import type {
	CarOrigin,
	CloseServiceBody,
	CreateMasterBody,
	CreateServiceRequestBody,
	MasterFeedFilter,
	MasterFeedItem,
	MasterFeedPage,
	MasterOfferBody,
	MasterPublic,
	MasterReview,
	Me,
	MyMaster,
	ServiceEstimate,
	ServiceOffer,
	ServiceRequestDetail,
	ServiceRequestSummaryPage,
	ServiceStats,
	ServiceType,
	UpdateMasterBody,
} from './types'

const DAY = 24 * 60 * 60_000

/**
 * TODO(backend): LocalTime is an object in OpenAPI, the API takes «09:00:00» (BACKEND_QUESTIONS.md #1).
 */
type WithTimes<T> = Omit<T, 'openFrom' | 'openTo'> & { openFrom?: string; openTo?: string }
export type SaveMasterBody = WithTimes<CreateMasterBody> | WithTimes<UpdateMasterBody>

// ─── Directory [33, 38, 05б] ─────────────────────────────────────────────────

export function useServiceTypes() {
	const query = useQuery({
		queryKey: serviceKeys.types,
		queryFn: ({ signal }) => apiFetch<ServiceType[]>('/service-types', { auth: false, signal }),
		staleTime: DAY,
	})
	return { ...query, data: query.data ?? BUNDLED_SERVICE_TYPES }
}

/** Name by code; `short` — «СТО», «Мойка» for chips. */
export function serviceName(types: ServiceType[] | undefined, code: string, short = false) {
	if (short && SERVICE_SHORT[code]) return SERVICE_SHORT[code]
	return (types ?? BUNDLED_SERVICE_TYPES).find((t) => t.code === code)?.name ?? code
}

// ─── Buyer: sending [36] ─────────────────────────────────────────────────────

/** «Заявку получат 12 СТО…» — recounted on every change of service, car, point or radius [36]. */
export function useServiceEstimate(params: {
	service?: string
	carId?: number | null
	brandId?: number
	origin?: CarOrigin | null
	lat: number
	lng: number
	radiusKm: number
}) {
	const query = {
		service: params.service,
		carId: params.carId ?? undefined,
		brandId: params.carId ? undefined : params.brandId,
		origin: params.origin ?? undefined,
		lat: params.lat,
		lng: params.lng,
		radiusKm: params.radiusKm,
	}
	return useQuery({
		queryKey: serviceKeys.estimate(query),
		queryFn: ({ signal }) => apiFetch<ServiceEstimate>('/service-requests/estimate', { query, signal }),
		enabled: Boolean(params.service && (params.carId || params.brandId)),
	})
}

/** POST /service-requests with `Idempotency-Key`, like parts requests. */
export function useCreateServiceRequest() {
	const queryClient = useQueryClient()
	const idempotencyKey = useRef<string | null>(null)
	return useMutation({
		mutationFn: (body: CreateServiceRequestBody) => {
			idempotencyKey.current ??= newIdempotencyKey()
			return apiFetch<ServiceRequestDetail>('/service-requests', { method: 'POST', body, idempotencyKey: idempotencyKey.current })
		},
		onSuccess: (request) => {
			idempotencyKey.current = null
			queryClient.setQueryData(serviceKeys.detail(request.id), request)
			queryClient.invalidateQueries({ queryKey: serviceKeys.my })
		},
	})
}

// ─── Buyer: my requests, offers, stats [05б, 37] ─────────────────────────────

export function useMyServiceRequests() {
	return useInfiniteQuery({
		queryKey: serviceKeys.my,
		queryFn: ({ pageParam, signal }) => apiFetch<ServiceRequestSummaryPage>('/service-requests/my', { query: { cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

export function useServiceRequest(id: number) {
	return useQuery({
		queryKey: serviceKeys.detail(id),
		queryFn: ({ signal }) => apiFetch<ServiceRequestDetail>(`/service-requests/${id}`, { signal }),
	})
}

/** «Могу помочь» offers, oldest first [37]. */
export function useServiceOffers(id: number) {
	return useQuery({
		queryKey: serviceKeys.offers(id),
		queryFn: ({ signal }) => apiFetch<ServiceOffer[]>(`/service-requests/${id}/offers`, { signal }),
		enabled: id > 0,
	})
}

/** Counts and timer [37]. Kept live by `SERVICE_REQUEST_STATS` (src/lib/realtime.tsx). */
export function useServiceStats(id: number) {
	return useQuery({
		queryKey: serviceKeys.stats(id),
		queryFn: ({ signal }) => apiFetch<ServiceStats>(`/service-requests/${id}/stats`, { signal }),
	})
}

function useServiceAction<T>(id: number, mutationFn: (variables: T) => Promise<unknown>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: serviceKeys.my })
		},
	})
}

/** «+30 мин» — up to 3 times (409 `EXTEND_LIMIT`). */
export function useExtendServiceRequest(id: number) {
	return useServiceAction(id, (minutes: 30 | 60 | 180) => apiFetch(`/service-requests/${id}/extend`, { method: 'POST', body: { minutes } }))
}

/** «Расширить радиус» — +5 km, new masters get a push, the timer restarts. */
export function useWidenServiceRequest(id: number) {
	return useServiceAction(id, () => apiFetch(`/service-requests/${id}/widen`, { method: 'POST' }))
}

/** «Договорились» — with the chosen master and an optional review (only a master who offered help). */
export function useCloseServiceRequest(id: number) {
	return useServiceAction(id, (body: CloseServiceBody) =>
		apiFetch<ServiceRequestDetail>(`/service-requests/${id}/close`, { method: 'POST', body })
	)
}

// ─── Master for the client [37] ──────────────────────────────────────────────

export function useMasterPublic(id: number) {
	return useQuery({
		queryKey: masterKeys.public(id),
		queryFn: ({ signal }) => apiFetch<MasterPublic>(`/masters/${id}`, { auth: false, signal }),
		enabled: id > 0,
	})
}

/** Share link `kudaibergen.kg/m/{publicId}`. */
export function useMasterByLink(publicId: string) {
	return useQuery({
		queryKey: masterKeys.publicByLink(publicId),
		queryFn: ({ signal }) => apiFetch<MasterPublic>(`/masters/public/${publicId}`, { auth: false, signal }),
		enabled: Boolean(publicId),
	})
}

export function useMasterReviews(id: number) {
	return useQuery({
		queryKey: masterKeys.reviews(id),
		queryFn: ({ signal }) => apiFetch<MasterReview[]>(`/masters/${id}/reviews`, { auth: false, signal }),
		enabled: id > 0,
	})
}

// ─── Master profile [38] ─────────────────────────────────────────────────────

/** null — no profile yet (404 `NO_MASTER`): the master mode starts at 38. */
export function useMyMaster(enabled = true) {
	return useQuery({
		queryKey: masterKeys.profile,
		queryFn: async ({ signal }) => {
			try {
				return await apiFetch<MyMaster>('/my/master', { signal })
			} catch (error) {
				if (error instanceof ApiError && (error.code === 'NO_MASTER' || error.status === 404)) return null
				throw error
			}
		},
		enabled,
	})
}

/** POST (first time — the user becomes a master) or PATCH /my/master. */
export function useSaveMaster(exists: boolean) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: SaveMasterBody) =>
			apiFetch<MyMaster>('/my/master', { method: exists ? 'PATCH' : 'POST', body }),
		onSuccess: async (master) => {
			queryClient.setQueryData(masterKeys.profile, master)
			queryClient.invalidateQueries({ queryKey: masterKeys.feedAll })
			// POST switches the role to MASTER and sets hasMaster — refresh the session.
			if (!exists) {
				const me = await apiFetch<Me>('/me')
				queryClient.setQueryData(meKeys.me, me)
				useSession.getState().setUser(me)
			}
		},
	})
}

function useMasterUpdate<T>(mutationFn: (variables: T) => Promise<MyMaster>) {
	const queryClient = useQueryClient()
	return useMutation({ mutationFn, onSuccess: (master) => queryClient.setQueryData(masterKeys.profile, master) })
}

/** Avatar [38]: `mediaId` from POST /media/photos (purpose MASTER); null — remove. */
export function useSetMasterAvatar() {
	return useMasterUpdate((mediaId: number | null) =>
		mediaId === null
			? apiFetch<MyMaster>('/my/master/avatar', { method: 'DELETE' })
			: apiFetch<MyMaster>('/my/master/avatar', { method: 'PUT', body: { mediaId } })
	)
}

/** Work photos, up to 8, the first is the cover — the whole list each time. */
export function useSetMasterPhotos() {
	return useMasterUpdate((mediaIds: number[]) => apiFetch<MyMaster>('/my/master/photos', { method: 'PUT', body: { mediaIds } }))
}

// ─── Master feed [39] ────────────────────────────────────────────────────────

export function useMasterFeed(filter: MasterFeedFilter = 'NEW') {
	return useInfiniteQuery({
		queryKey: masterKeys.feed(filter),
		queryFn: ({ pageParam, signal }) => apiFetch<MasterFeedPage>('/my/master/requests', { query: { filter, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

/** The master saw the card — counts for the buyer's «Посмотрели». Fire and forget. */
export function markServiceSeen(id: number) {
	return apiFetch(`/my/master/requests/${id}/seen`, { method: 'POST' }).catch(() => {})
}

/** «Могу помочь» / «Не моё» — once (409 `ALREADY_ANSWERED`, `REQUEST_EXPIRED`). */
export function useMasterOffer() {
	const queryClient = useQueryClient()
	const keys = useRef(new Map<number, string>())
	return useMutation({
		mutationFn: ({ id, body }: { id: number; body: MasterOfferBody }) => {
			const key = keys.current.get(id) ?? newIdempotencyKey()
			keys.current.set(id, key)
			return apiFetch<ServiceOffer>(`/my/master/requests/${id}/offer`, { method: 'POST', body, idempotencyKey: key })
		},
		// «Не моё» takes the card off «Новые» at once; it comes back if the server says no.
		onMutate: async ({ id, body }) => {
			if (body.answer !== 'NOT_MINE') return
			const key = masterKeys.feed('NEW')
			await queryClient.cancelQueries({ queryKey: key })
			const previous = queryClient.getQueryData<InfiniteData<MasterFeedPage>>(key)
			queryClient.setQueryData<InfiniteData<MasterFeedPage>>(key, (data) => mapPages(data, (items) => items.filter((item) => item.id !== id)))
			return { key, previous }
		},
		onError: (_, __, context) => {
			if (context) queryClient.setQueryData(context.key, context.previous)
		},
		onSuccess: (_, { id }) => {
			keys.current.delete(id)
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: masterKeys.feedAll }),
	})
}

/** One request of the feed — the «Проверьте и отправьте» sheet [19]. */
export function useMasterRequest(id: number) {
	return useQuery({
		queryKey: [...masterKeys.feedAll, 'one', id],
		queryFn: ({ signal }) => apiFetch<MasterFeedItem>(`/my/master/requests/${id}`, { signal }),
		enabled: id > 0,
	})
}
