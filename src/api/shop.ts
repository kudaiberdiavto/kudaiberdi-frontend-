// Seller's own box [11, 13, 15]: registration, profile, brands, open toggle, moving.
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

/** «Начать получать запросы» [11]: container + brands; the name defaults to «Ряд 14, конт. 12». */
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

/** Avatar of the box: `mediaId` from POST /media/photos (purpose AVATAR). */
export function useSetShopAvatar() {
	return useShopMutation((mediaId: number) => apiFetch<MyShop>('/my/shop/avatar', { method: 'PUT', body: { mediaId } }))
}

/** «Марки, которые продаю» [23] — requests come only for these. */
export function useSetShopBrands() {
	return useShopMutation((brandIds: number[]) => apiFetch<MyShop>('/my/shop/brands', { method: 'PUT', body: { brandIds } }))
}

// ─── Photos of the place [22]: up to 8, the first is the cover ──────────────

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

// ─── Verification of the place ──────────────────────────────────────────────

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

/** Moving to another container: stays on the old one until the new place is verified. */
export function useRelocateShop() {
	return useVerificationMutation((containerId: number) =>
		apiFetch<Verification>('/my/shop/relocation', { method: 'POST', body: { containerId } })
	)
}
