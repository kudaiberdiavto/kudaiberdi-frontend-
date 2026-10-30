// Buyer's catalog [27–30]: part search, part card, shop profile, favorites.
import { keepPreviousData, useInfiniteQuery, type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useSession } from '@/store/useSession'
import { catalogKeys, meKeys, shopKeys, videoKeys } from './keys'
import { cursorPaging } from './pagination'
import type { PartComment, PartCommentPage, PartDetail, ShopCardPage, PartSearchResult, ReviewPage, ShopPublic, VideoFeedPage } from './types'

/** Filters of GET /parts/search — the same for /parts/search/count and /shops/{id}/parts. */
export interface PartFilters {
	q?: string
	carId?: number
	brandId?: number
	modelId?: number
	year?: number
	categoryId?: number
	sort?: 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'NEAREST'
}

/** «24 запчасти для Camry 50» — `total` and `appliedCar` come from the server [27]. */
export function useSearchParts(filters: PartFilters) {
	return useInfiniteQuery({
		queryKey: catalogKeys.search(filters),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<PartSearchResult>('/parts/search', { query: { ...filters, cursor: pageParam }, signal }),
		...cursorPaging,
		placeholderData: keepPreviousData,
	})
}

/** «Показать 86» on the brand sheet [28]. */
export function useSearchCount(filters: PartFilters, enabled = true) {
	return useQuery({
		queryKey: catalogKeys.count(filters),
		queryFn: ({ signal }) => apiFetch<number>('/parts/search/count', { query: { ...filters }, signal }),
		enabled,
		placeholderData: keepPreviousData,
	})
}

/** Part card [29]; the car decides «Подходит к вашей Camry 50 · 2012». */
export function usePart(id: number, car: Pick<PartFilters, 'carId' | 'brandId' | 'modelId' | 'year'> = {}) {
	return useQuery({
		queryKey: catalogKeys.detail(id, car),
		queryFn: ({ signal }) => apiFetch<PartDetail>(`/parts/${id}`, { query: { ...car }, signal }),
		enabled: id > 0,
	})
}

/** Share link `https://kudaibergen.kg/p/{publicId}` opens here. */
export function usePublicPart(publicId: string) {
	return useQuery({
		queryKey: catalogKeys.publicDetail(publicId),
		queryFn: ({ signal }) => apiFetch<PartDetail>(`/parts/public/${publicId}`, { signal }),
		enabled: Boolean(publicId),
	})
}

/** ♥ on the part card. Optimistic; guests are sent to sign in by the caller. */
export function useTogglePartFavorite(id: number) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (favorite: boolean) =>
			apiFetch<void>(`/parts/${id}/favorite`, { method: favorite ? 'PUT' : 'DELETE' }),
		onMutate: (favorite) => {
			queryClient.setQueriesData<PartDetail>({ queryKey: ['catalog', 'detail', id] }, (part) =>
				part ? { ...part, isFavorite: favorite } : part
			)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['catalog', 'detail', id] })
			queryClient.invalidateQueries({ queryKey: meKeys.favoriteParts })
		},
	})
}

// ─── Shop profile for buyers [30] ────────────────────────────────────────────

export function useShop(id: number) {
	return useQuery({
		queryKey: shopKeys.public(id),
		queryFn: ({ signal }) => apiFetch<ShopPublic>(`/shops/${id}`, { signal }),
		enabled: id > 0,
	})
}

/** Share link `https://kudaibergen.kg/s/{publicId}` opens here. */
export function usePublicShop(publicId: string) {
	return useQuery({
		queryKey: shopKeys.publicById(publicId),
		queryFn: ({ signal }) => apiFetch<ShopPublic>(`/shops/public/${publicId}`, { signal }),
		enabled: Boolean(publicId),
	})
}

/** Tab «Запчасти» of the shop profile — same filters as the search. */
export function useShopParts(shopId: number, filters: PartFilters = {}) {
	return useInfiniteQuery({
		queryKey: shopKeys.parts(shopId, filters),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<PartSearchResult>(`/shops/${shopId}/parts`, { query: { ...filters, cursor: pageParam }, signal }),
		...cursorPaging,
		enabled: shopId > 0,
	})
}

/** Tab «Отзывы» of the shop profile [30]. */
export function useShopReviews(shopId: number, enabled = true) {
	return useInfiniteQuery({
		queryKey: shopKeys.publicReviews(shopId),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<ReviewPage>(`/shops/${shopId}/reviews`, { query: { cursor: pageParam }, signal }),
		...cursorPaging,
		enabled: enabled && shopId > 0,
	})
}

export function useToggleShopFavorite(id: number) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (favorite: boolean) => apiFetch<void>(`/shops/${id}/favorite`, { method: favorite ? 'PUT' : 'DELETE' }),
		onMutate: (favorite) => {
			queryClient.setQueryData<ShopPublic>(shopKeys.public(id), (shop) => (shop ? { ...shop, isFavorite: favorite } : shop))
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: shopKeys.public(id) })
			queryClient.invalidateQueries({ queryKey: meKeys.favoriteShops })
		},
	})
}

/** Whether the user can use favorites / chats (catalog and shop profiles are open to guests). */
export function useSignedIn() {
	return useSession((s) => s.status === 'authed')
}

// ─── Videos from the market: the «Рынок» feed and «Видео с рынка» on the home screen ─────

/** GET /catalog/videos — parts with a video, the ones fitting the car first, then the newest. */
export function useVideoFeed(car: { carId?: number; brandId?: number; modelId?: number; year?: number } = {}, limit = 10) {
	return useInfiniteQuery({
		queryKey: videoKeys.feed({ ...car, limit }),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<VideoFeedPage>('/catalog/videos', { query: { ...car, limit, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

/** «Сохр.» in the feed — the part's favorite, updated in the feed pages right away. */
export function useToggleVideoFavorite() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ partId, favorite }: { partId: number; favorite: boolean }) =>
			apiFetch<void>(`/parts/${partId}/favorite`, { method: favorite ? 'PUT' : 'DELETE' }),
		onMutate: ({ partId, favorite }) => {
			queryClient.setQueriesData<InfiniteData<VideoFeedPage>>({ queryKey: ['videos', 'feed'] }, (data) =>
				data
					? {
							...data,
							pages: data.pages.map((page) => ({
								...page,
								items: page.items.map((item) =>
									item.partId === partId
										? { ...item, isFavorite: favorite, favoritesCount: Math.max(0, item.favoritesCount + (favorite ? 1 : -1)) }
										: item
								),
							})),
						}
					: data
			)
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: meKeys.favoriteParts }),
	})
}

/** «Поделиться» in the feed went through: +1 under the paper plane (a guest too). */
export function useSharePart() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (partId: number) => apiFetch<void>(`/parts/${partId}/share`, { method: 'POST' }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['videos', 'feed'] }),
	})
}

/** Comments under a video part — newest first. */
export function usePartComments(partId: number, enabled = true) {
	return useInfiniteQuery({
		queryKey: videoKeys.comments(partId),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<PartCommentPage>(`/parts/${partId}/comments`, { query: { cursor: pageParam }, signal }),
		enabled: enabled && partId > 0,
		...cursorPaging,
	})
}

/** After a comment is added or deleted: the list and the «Комм.» counter in the feed. */
function useCommentMutation<V>(partId: number, mutationFn: (vars: V) => Promise<unknown>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: videoKeys.comments(partId) })
			queryClient.invalidateQueries({ queryKey: ['videos', 'feed'] })
		},
	})
}

export function useAddPartComment(partId: number) {
	return useCommentMutation(partId, (text: string) =>
		apiFetch<PartComment>(`/parts/${partId}/comments`, { method: 'POST', body: { text } })
	)
}

export function useDeletePartComment(partId: number) {
	return useCommentMutation(partId, (commentId: number) =>
		apiFetch<void>(`/parts/${partId}/comments/${commentId}`, { method: 'DELETE' })
	)
}

/** «Все магазины»: действующие магазины рынка и центры, поиск по названию. */
export function useShopList(q: string) {
	return useInfiniteQuery({
		queryKey: shopKeys.list({ q: q.trim() }),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<ShopCardPage>('/shops', { query: { q: q.trim() || undefined, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}
