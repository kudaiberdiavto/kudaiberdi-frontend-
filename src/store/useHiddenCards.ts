import { create } from 'zustand'

// Cards taken off a feed while their «Вернуть» toast is up («Нет» to a request, «Не моё» to a client's request):
// the feed filters them out at once, the answer itself goes to the server only when the toast is gone.

export type HiddenKind = 'incoming' | 'master-feed'

interface HiddenCards {
	keys: string[]
	hide: (kind: HiddenKind, id: number) => void
	show: (kind: HiddenKind, id: number) => void
}

const key = (kind: HiddenKind, id: number) => `${kind}:${id}`

export const useHiddenCards = create<HiddenCards>((set) => ({
	keys: [],
	hide: (kind, id) => set((s) => ({ keys: [...s.keys, key(kind, id)] })),
	show: (kind, id) => set((s) => ({ keys: s.keys.filter((k) => k !== key(kind, id)) })),
}))

/** The ids of `kind` hidden right now — for the feed's filter. */
export function useHiddenIds(kind: HiddenKind) {
	const keys = useHiddenCards((s) => s.keys)
	return keys.filter((k) => k.startsWith(`${kind}:`)).map((k) => Number(k.slice(kind.length + 1)))
}
