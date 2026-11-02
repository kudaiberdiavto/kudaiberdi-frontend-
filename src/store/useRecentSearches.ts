import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localJsonStorage } from '@/lib/local-json'

// The catalog's last searches [27] — chips under the field while it's focused and empty.
// People look for the same part again (price check, another shop); kept on the device only.

const MAX = 8

interface RecentSearches {
	items: string[]
	add: (q: string) => void
	remove: (q: string) => void
	clear: () => void
}

export const useRecentSearches = create<RecentSearches>()(
	persist(
		(set) => ({
			items: [],
			add: (q) => {
				const text = q.trim()
				if (text.length < 2) return
				set((s) => ({ items: [text, ...s.items.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, MAX) }))
			},
			remove: (q) => set((s) => ({ items: s.items.filter((item) => item !== q) })),
			clear: () => set({ items: [] }),
		}),
		{ name: 'catalog.recent', storage: createJSONStorage(() => localJsonStorage) }
	)
)
