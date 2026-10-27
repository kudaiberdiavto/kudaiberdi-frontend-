// Seller's catalog [24, 25, 26]: my parts, drafts, publishing, OEM number recognition.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, compressPhoto, imageFormData } from '@/lib/api'
import { partKeys } from './keys'
import { cursorPaging } from './pagination'
import type { MyPartsFilter, MyPartsPage, MyPartsSummary, OemRecognition, PartDetail, PartInput } from './types'

/** «Все / В наличии / Нет / Черновики» with search — infinite list [24]. */
export function useMyParts(filter: MyPartsFilter, q?: string) {
	return useInfiniteQuery({
		queryKey: partKeys.my(filter, q),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<MyPartsPage>('/my/parts', { query: { filter, q: q || undefined, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

/** Chip counters and «посмотрели 214 раз за неделю» — counted on the server. */
export function useMyPartsSummary() {
	return useQuery({
		queryKey: partKeys.mySummary,
		queryFn: ({ signal }) => apiFetch<MyPartsSummary>('/my/parts/summary', { signal }),
	})
}

/** The edit form of one of my parts [26]. */
export function useMyPart(id: number | undefined) {
	return useQuery({
		queryKey: partKeys.myDetail(id ?? 0),
		queryFn: ({ signal }) => apiFetch<PartDetail>(`/my/parts/${id}`, { signal }),
		enabled: Boolean(id),
	})
}

function usePartMutation<TVariables, TResult extends PartDetail | void>(
	mutationFn: (variables: TVariables) => Promise<TResult>
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn,
		onSuccess: (part) => {
			if (part) queryClient.setQueryData(partKeys.myDetail(part.id), part)
			// Lists and chip counters on 24 changed.
			queryClient.invalidateQueries({ queryKey: ['parts', 'my'] })
			// A part with a video shows up in «Видео с рынка» and the feed (or leaves them).
			queryClient.invalidateQueries({ queryKey: ['videos'] })
		},
	})
}

/** Create a draft (no id yet) or save changes. Drafts may be incomplete. */
export function useSavePart() {
	return usePartMutation(({ id, body }: { id?: number; body: PartInput }) =>
		id
			? apiFetch<PartDetail>(`/parts/${id}`, { method: 'PATCH', body })
			: apiFetch<PartDetail>('/parts', { method: 'POST', body, query: { publish: false } })
	)
}

/** 400 PART_INCOMPLETE with `extra.missing` — which fields are still empty. */
export function usePublishPart() {
	return usePartMutation((id: number) => apiFetch<PartDetail>(`/parts/${id}/publish`, { method: 'POST' }))
}

export function useArchivePart() {
	return usePartMutation((id: number) => apiFetch<PartDetail>(`/parts/${id}/archive`, { method: 'POST' }))
}

export function useRestorePart() {
	return usePartMutation((id: number) => apiFetch<PartDetail>(`/parts/${id}/restore`, { method: 'POST' }))
}

export function useDeletePart() {
	return usePartMutation((id: number) => apiFetch<void>(`/parts/${id}`, { method: 'DELETE' }))
}

/** Camera mode «Номер детали» [25]: photo of the label → OEM number candidates. */
export function useRecognizeOem() {
	return useMutation({
		mutationFn: async (uri: string) =>
			apiFetch<OemRecognition>('/ocr/oem', { method: 'POST', body: await imageFormData(await compressPhoto(uri)) }),
	})
}
