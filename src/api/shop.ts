// Seller's own box [10а, 10, 11, 21, 22, 23] and its verification.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useSession } from '@/store/useSession'
import { meKeys, shopKeys } from './keys'
import type { Me, MyShop, ShopPhoto, Verification } from './types'
import type { components } from './schema'

type Schemas = components['schemas']

/**
 * TODO(backend): LocalTime is described as an object in OpenAPI but the API takes «08:00:00»
 * (BACKEND_QUESTIONS.md #1) — send strings until the schema is fixed.
 */
type WithTimes<T> = Omit<T, 'openFrom' | 'openTo'> & { openFrom?: string; openTo?: string }
export type CreateShopBody = WithTimes<Schemas['CreateShop']>
export type UpdateShopBody = WithTimes<Schemas['UpdateShop']>

export function useMyShop() {
	const hasShop = useSession((s) => s.hasShop)
	return useQuery({
		queryKey: shopKeys.my,
		queryFn: ({ signal }) => apiFetch<MyShop>('/my/shop', { signal }),
		enabled: hasShop,
	})
}

function useShopMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<MyShop>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: (shop) => queryClient.setQueryData(shopKeys.my, shop),
	})
}

/** Registration [10а → 10]: the shop starts as PENDING_VERIFICATION until the QR check. */
export function useRegisterShop() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: CreateShopBody) => apiFetch<MyShop>('/shops', { method: 'POST', body }),
		onSuccess: async (shop) => {
			queryClient.setQueryData(shopKeys.my, shop)
			// `hasShop` flips on the server — refresh the profile so routing follows.
			const me = await apiFetch<Me>('/me')
			useSession.getState().setUser(me)
			queryClient.setQueryData(meKeys.me, me)
		},
	})
}

export function useUpdateShop() {
	return useShopMutation((body: UpdateShopBody) => apiFetch<MyShop>('/my/shop', { method: 'PATCH', body }))
}

/** «Марки, которые продаю» [23] — requests come only for these. */
export function useSetShopBrands() {
	return useShopMutation((brandIds: number[]) => apiFetch<MyShop>('/my/shop/brands', { method: 'PUT', body: { brandIds } }))
}

export function useSetShopCategories() {
	return useShopMutation((categoryIds: number[]) =>
		apiFetch<MyShop>('/my/shop/categories', { method: 'PUT', body: { categoryIds } })
	)
}

/** Toggle «Бокс открыт / закрыт» [11, 21] — a closed box gets no requests. Optimistic. */
export function useSetShopOpen() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (isOpen: boolean) => apiFetch<MyShop>('/my/shop/open', { method: 'PATCH', body: { isOpen } }),
		onMutate: async (isOpen) => {
			await queryClient.cancelQueries({ queryKey: shopKeys.my })
			const previous = queryClient.getQueryData<MyShop>(shopKeys.my)
			if (previous) queryClient.setQueryData<MyShop>(shopKeys.my, { ...previous, isOpen })
			return { previous }
		},
		onError: (_error, _isOpen, context) => {
			if (context?.previous) queryClient.setQueryData(shopKeys.my, context.previous)
		},
		onSuccess: (shop) => queryClient.setQueryData(shopKeys.my, shop),
	})
}

/** Avatar from POST /media/photos (purpose AVATAR); `null` removes it. */
export function useSetShopAvatar() {
	return useShopMutation((mediaId: number | null) =>
		mediaId === null
			? apiFetch<MyShop>('/my/shop/avatar', { method: 'DELETE' })
			: apiFetch<MyShop>('/my/shop/avatar', { method: 'PUT', body: { mediaId } })
	)
}

// ─── Photos of the place [22]: up to 8, the first is the cover ──────────────

export function useShopPhotos() {
	return useQuery({
		queryKey: shopKeys.photos,
		queryFn: ({ signal }) => apiFetch<ShopPhoto[]>('/my/shop/photos', { signal }),
	})
}

function usePhotosMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<ShopPhoto[]>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: (photos) => {
			queryClient.setQueryData(shopKeys.photos, photos)
			queryClient.invalidateQueries({ queryKey: shopKeys.my })
		},
	})
}

export function useAddShopPhoto() {
	return usePhotosMutation((mediaId: number) =>
		apiFetch<ShopPhoto[]>('/my/shop/photos', { method: 'POST', body: { mediaId } })
	)
}

export function useMakeShopCover() {
	return usePhotosMutation((mediaId: number) =>
		apiFetch<ShopPhoto[]>(`/my/shop/photos/${mediaId}/cover`, { method: 'POST' })
	)
}

export function useRemoveShopPhoto() {
	return usePhotosMutation((mediaId: number) => apiFetch<ShopPhoto[]>(`/my/shop/photos/${mediaId}`, { method: 'DELETE' }))
}

// ─── Verification of the place ──────────────────────────────────────────────

export function useVerification() {
	return useQuery({
		queryKey: shopKeys.verification,
		queryFn: ({ signal }) => apiFetch<Verification>('/my/shop/verification', { signal }),
	})
}

function useVerificationMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Verification>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: (verification) => {
			queryClient.setQueryData(shopKeys.verification, verification)
			queryClient.invalidateQueries({ queryKey: shopKeys.my })
		},
	})
}

/** The QR sticker on the container — instant approval. 400 QR_MISMATCH / NOT_AT_MARKET / LOCATION_REQUIRED. */
export function useVerifyByQr() {
	return useVerificationMutation((body: { qrToken: string; lat?: number; lon?: number }) =>
		apiFetch<Verification>('/my/shop/verification/qr', { method: 'POST', body })
	)
}

/** No sticker — ask the market administration (up to one working day). */
export function useRequestAdminVerification() {
	return useVerificationMutation(() => apiFetch<Verification>('/my/shop/verification/admin-request', { method: 'POST' }))
}

/** Moving to another container: stays on the old one until the new place is verified. */
export function useRelocateShop() {
	return useVerificationMutation((containerId: number) =>
		apiFetch<Verification>('/my/shop/relocation', { method: 'POST', body: { containerId } })
	)
}
