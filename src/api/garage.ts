// Buyer's garage [04, chips on 06 and 27].
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { meKeys } from './keys'
import type { Car, CreateCarBody } from './types'

/** Primary car first — the server sorts. */
/** `enabled` — false for a guest (no garage; avoids 401s). */
export function useCars(enabled = true) {
	return useQuery({
		queryKey: meKeys.cars,
		queryFn: ({ signal }) => apiFetch<Car[]>('/me/cars', { signal }),
		enabled,
	})
}

function useCarMutation<T, R>(mutationFn: (variables: T) => Promise<R>) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: meKeys.cars }),
	})
}

/** The first car becomes primary; at most 10 cars. */
export function useAddCar() {
	return useCarMutation((body: CreateCarBody) => apiFetch<Car>('/me/cars', { method: 'POST', body }))
}

export function useMakePrimaryCar() {
	return useCarMutation((id: number) => apiFetch<Car>(`/me/cars/${id}/primary`, { method: 'POST' }))
}

export function useDeleteCar() {
	return useCarMutation((id: number) => apiFetch<void>(`/me/cars/${id}`, { method: 'DELETE' }))
}
