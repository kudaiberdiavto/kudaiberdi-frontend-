// Profile, role and settings [03, 19, 21].
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useSession } from '@/store/useSession'
import { meKeys } from './keys'
import type { Me, PartCard, Settings, ShopCard, UpdateMeBody, UpdateSettingsBody, UserRole } from './types'

export function useMe() {
	const signedIn = useSession((s) => s.status === 'authed')
	return useQuery({
		queryKey: meKeys.me,
		queryFn: ({ signal }) => apiFetch<Me>('/me', { signal }),
		enabled: signedIn,
	})
}

/** «Кто вы?» [03]. */
export function useSetRole() {
	return useMutation({
		mutationFn: (role: UserRole) => apiFetch<Me>('/me/role', { method: 'PUT', body: { role } }),
		onSuccess: (me) => useSession.getState().setUser(me),
	})
}

export function useUpdateMe() {
	return useMutation({
		mutationFn: (body: UpdateMeBody) => apiFetch<Me>('/me', { method: 'PATCH', body }),
		onSuccess: (me) => useSession.getState().setUser(me),
	})
}

export function useSettings() {
	return useQuery({
		queryKey: meKeys.settings,
		queryFn: ({ signal }) => apiFetch<Settings>('/me/settings', { signal }),
	})
}

export function useUpdateSettings() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (body: UpdateSettingsBody) => apiFetch<Settings>('/me/settings', { method: 'PATCH', body }),
		onSuccess: (settings) => queryClient.setQueryData(meKeys.settings, settings),
	})
}

/** «Избранное» — parts and shops the user tapped ♥ on; refreshed by the ♥ toggles (catalog.ts). */
export function useFavoriteParts(enabled = true) {
	return useQuery({
		queryKey: meKeys.favoriteParts,
		queryFn: ({ signal }) => apiFetch<PartCard[]>('/me/favorite-parts', { signal }),
		enabled,
	})
}

export function useFavoriteShops(enabled = true) {
	return useQuery({
		queryKey: meKeys.favoriteShops,
		queryFn: ({ signal }) => apiFetch<ShopCard[]>('/me/favorite-shops', { signal }),
		enabled,
	})
}
