import { create } from 'zustand'
import type { PartFilters } from '@/api/catalog'
import type { Brand } from '@/api/types'

// Search filters of the catalog [27], shared with the brand picker [28]:
// a garage car OR «Любая марка» → brand (+ model), plus text, category and sort.

export type CatalogSort = NonNullable<PartFilters['sort']>

interface CatalogFilters {
	q: string
	/**
	 * Car from the garage; `undefined` — not chosen yet (the primary car is used),
	 * `null` — «Любая марка» (then `brand`/`modelId` apply).
	 */
	carId: number | null | undefined
	brand: Brand | null
	modelId: number | null
	modelLabel: string | null
	categoryId: number | null
	sort: CatalogSort
	setQ: (q: string) => void
	pickCar: (carId: number) => void
	pickBrand: (brand: Brand | null, model?: { id: number; label: string } | null) => void
	setCategory: (categoryId: number | null) => void
	setSort: (sort: CatalogSort) => void
}

export const useCatalogFilters = create<CatalogFilters>((set) => ({
	q: '',
	carId: undefined,
	brand: null,
	modelId: null,
	modelLabel: null,
	categoryId: null,
	sort: 'PRICE_ASC',
	setQ: (q) => set({ q }),
	pickCar: (carId) => set({ carId, brand: null, modelId: null, modelLabel: null }),
	pickBrand: (brand, model) =>
		set({ carId: null, brand, modelId: model?.id ?? null, modelLabel: model?.label ?? null }),
	setCategory: (categoryId) => set({ categoryId }),
	setSort: (sort) => set({ sort }),
}))

/** Query params for /parts/search and /parts/search/count. */
export function toPartFilters(f: Pick<CatalogFilters, 'q' | 'carId' | 'brand' | 'modelId' | 'categoryId' | 'sort'>): PartFilters {
	return {
		q: f.q.trim() || undefined,
		carId: f.carId ?? undefined,
		brandId: f.carId ? undefined : (f.brand?.id ?? undefined),
		modelId: f.carId ? undefined : (f.modelId ?? undefined),
		categoryId: f.categoryId ?? undefined,
		sort: f.sort,
	}
}
