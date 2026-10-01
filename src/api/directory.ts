// Reference data: brands, models, categories. Open to guests, rarely changes.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { directoryKeys } from './keys'
import type { Brand, CarModel, Category } from './types'

const DAY = 24 * 60 * 60_000

/** `q` also knows folk names: «мерс», «бэха», «камри». */
export function useBrands(params: { popular?: boolean; q?: string } = {}) {
	return useQuery({
		queryKey: directoryKeys.brands(params),
		queryFn: ({ signal }) => apiFetch<Brand[]>('/brands', { query: params, auth: false, signal }),
		staleTime: params.q ? 60_000 : DAY,
		placeholderData: keepPreviousData,
	})
}

/** Models with generations: label «Camry 50», years for the year picker. */
export function useModels(brandId: number | undefined) {
	return useQuery({
		queryKey: directoryKeys.models(brandId ?? 0),
		queryFn: ({ signal }) => apiFetch<CarModel[]>(`/brands/${brandId}/models`, { auth: false, signal }),
		enabled: brandId !== undefined,
		staleTime: DAY,
	})
}

export function useCategories() {
	return useQuery({
		queryKey: directoryKeys.categories,
		queryFn: ({ signal }) => apiFetch<Category[]>('/categories', { auth: false, signal }),
		staleTime: DAY,
	})
}
