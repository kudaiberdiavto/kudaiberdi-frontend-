import { create } from 'zustand'
import type { RequestDuration, RequestTarget } from '@/api/types'

// Audience of the request being composed — shared by 06, 06б and 31 so the
// pickers can live on their own screens. Reset after the request is sent.

export interface DraftRow {
	id: number
	/** «14», «Ц» — for «в рядах 14 и Ц». */
	code: string
	/** «Ряд 14». */
	label: string
}

export interface DraftContainer {
	id: number
	rowId: number
	rowCode: string
	rowLabel: string
	number: number
}

export const MAX_ROWS = 10
export const MAX_CONTAINERS = 30

interface RequestDraft {
	target: RequestTarget
	rows: DraftRow[]
	containers: DraftContainer[]
	duration: RequestDuration
	setTarget: (target: RequestTarget) => void
	toggleRow: (row: DraftRow) => void
	toggleContainer: (container: DraftContainer) => void
	setDuration: (duration: RequestDuration) => void
	reset: () => void
}

const initial = { target: 'MARKET' as RequestTarget, rows: [], containers: [], duration: 'MIN_30' as RequestDuration }

export const useRequestDraft = create<RequestDraft>((set) => ({
	...initial,
	setTarget: (target) => set({ target }),
	toggleRow: (row) =>
		set((s) => ({
			rows: s.rows.some((r) => r.id === row.id)
				? s.rows.filter((r) => r.id !== row.id)
				: s.rows.length < MAX_ROWS
					? [...s.rows, row]
					: s.rows,
		})),
	toggleContainer: (container) =>
		set((s) => ({
			containers: s.containers.some((c) => c.id === container.id)
				? s.containers.filter((c) => c.id !== container.id)
				: s.containers.length < MAX_CONTAINERS
					? [...s.containers, container]
					: s.containers,
		})),
	setDuration: (duration) => set({ duration }),
	reset: () => set(initial),
}))

/** The audience part of POST /requests and GET /requests/estimate. */
export function audienceOf(draft: Pick<RequestDraft, 'target' | 'rows' | 'containers'>) {
	return {
		target: draft.target,
		rowIds: draft.target === 'ROWS' ? draft.rows.map((r) => r.id) : undefined,
		containerIds: draft.target === 'CONTAINERS' ? draft.containers.map((c) => c.id) : undefined,
	}
}
