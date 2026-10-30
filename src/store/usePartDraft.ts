import { create } from 'zustand'
import { resolveUrl, uploadPhoto } from '@/lib/api'
import type { Brand, PartCondition, PartDetail, PartInput } from '@/api/types'

// The part being created or edited — shared by the camera [25], the form [26]
// and the car picker, which are separate screens. Photos upload as soon as
// they are taken; the form sends only the uploaded `mediaIds`.

export const MAX_PART_PHOTOS = 6

export interface DraftPhoto {
	key: string
	/** Local file (new shot) or server URL (already attached). */
	uri: string
	status: 'uploading' | 'done' | 'error'
	progress: number
	mediaId?: number
}

export interface DraftFitment {
	brandId: number
	modelId?: number
	yearFrom?: number
	yearTo?: number
	/** «Camry 40–50», «ES 2007–12». */
	label: string
	/** For the logo on the chip. */
	brand?: Brand
}

interface PartDraft {
	id?: number
	title: string
	categoryId?: number
	condition: PartCondition
	price: string
	quantity: number
	oemNumber?: string
	fitments: DraftFitment[]
	photos: DraftPhoto[]
	set: (patch: Partial<Pick<PartDraft, 'title' | 'categoryId' | 'condition' | 'price' | 'quantity' | 'oemNumber'>>) => void
	addPhotos: (uris: string[]) => void
	retryPhoto: (key: string) => void
	removePhoto: (key: string) => void
	/** The first photo is the main one. */
	makeMain: (key: string) => void
	addFitment: (fitment: DraftFitment) => void
	removeFitment: (index: number) => void
	/** Start a new part. */
	reset: () => void
	/** Edit an existing part. */
	load: (part: PartDetail) => void
}

const empty = {
	id: undefined,
	title: '',
	categoryId: undefined,
	condition: 'NEW' as PartCondition,
	price: '',
	quantity: 1,
	oemNumber: undefined,
	fitments: [],
	photos: [],
}

export const usePartDraft = create<PartDraft>((set, get) => {
	const patchPhoto = (key: string, next: Partial<DraftPhoto>) =>
		set((s) => ({ photos: s.photos.map((p) => (p.key === key ? { ...p, ...next } : p)) }))

	const upload = async (key: string, uri: string) => {
		patchPhoto(key, { status: 'uploading', progress: 0 })
		try {
			const photo = await uploadPhoto(uri, 'PART', { onProgress: (progress) => patchPhoto(key, { progress }) })
			patchPhoto(key, { status: 'done', progress: 1, mediaId: photo.id })
		} catch {
			patchPhoto(key, { status: 'error' })
		}
	}

	return {
		...empty,
		set: (patch) => set(patch),
		addPhotos: (uris) => {
			const free = MAX_PART_PHOTOS - get().photos.length
			const added = uris.slice(0, Math.max(0, free)).map((uri, i) => ({
				key: `${Date.now()}-${i}`,
				uri,
				status: 'uploading' as const,
				progress: 0,
			}))
			set((s) => ({ photos: [...s.photos, ...added] }))
			added.forEach((p) => upload(p.key, p.uri))
		},
		retryPhoto: (key) => {
			const photo = get().photos.find((p) => p.key === key)
			if (photo && photo.status === 'error') upload(key, photo.uri)
		},
		removePhoto: (key) => set((s) => ({ photos: s.photos.filter((p) => p.key !== key) })),
		makeMain: (key) =>
			set((s) => {
				const photo = s.photos.find((p) => p.key === key)
				return photo ? { photos: [photo, ...s.photos.filter((p) => p.key !== key)] } : s
			}),
		addFitment: (fitment) => set((s) => ({ fitments: [...s.fitments, fitment] })),
		removeFitment: (index) => set((s) => ({ fitments: s.fitments.filter((_, i) => i !== index) })),
		reset: () => set(empty),
		load: (part) =>
			set({
				id: part.id,
				title: part.title ?? '',
				categoryId: part.category?.id,
				condition: part.condition ?? 'NEW',
				price: part.price ? String(part.price) : '',
				// A draft starts in stock; a published part keeps 0 = «нет в наличии».
				quantity: part.status === 'DRAFT' ? part.quantity || 1 : part.quantity,
				oemNumber: part.oemNumber ?? undefined,
				fitments: part.fitments.map((f) => ({
					brandId: f.brand.id,
					modelId: f.modelId ?? undefined,
					yearFrom: f.yearFrom ?? undefined,
					yearTo: f.yearTo ?? undefined,
					label: f.label,
					brand: f.brand,
				})),
				photos: part.photos.map((p) => ({
					key: `server-${p.id}`,
					uri: resolveUrl(p.thumbUrl ?? p.url),
					status: 'done' as const,
					progress: 1,
					mediaId: p.id,
				})),
			}),
	}
})

/** PartInput for POST /parts and PATCH /parts/{id}. */
export function partBody(draft: PartDraft): PartInput {
	const price = Number(draft.price.replace(/\D/g, ''))
	return {
		title: draft.title.trim() || undefined,
		categoryId: draft.categoryId,
		condition: draft.condition,
		price: price > 0 ? price : undefined,
		quantity: draft.quantity,
		oemNumber: draft.oemNumber || undefined,
		mediaIds: draft.photos.flatMap((p) => (p.mediaId ? [p.mediaId] : [])),
		fitments: draft.fitments.map(({ brandId, modelId, yearFrom, yearTo }) => ({ brandId, modelId, yearFrom, yearTo })),
	}
}
