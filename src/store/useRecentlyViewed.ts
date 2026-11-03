import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localJsonStorage } from '@/lib/local-json'
import type { PartDetail } from '@/api/types'

// «Недавно смотрели» on the home screen: the last parts opened, newest first, kept on the device.
// People compare and come back to the same part several times before buying.

const MAX = 12

export interface ViewedPart {
	id: number
	title: string | null
	price: number | null
	thumbUrl: string | null
	shopName: string
}

interface RecentlyViewed {
	items: ViewedPart[]
	add: (part: PartDetail) => void
	clear: () => void
}

export const useRecentlyViewed = create<RecentlyViewed>()(
	persist(
		(set) => ({
			items: [],
			add: (part) => {
				const item: ViewedPart = {
					id: part.id,
					title: part.title,
					price: part.price,
					thumbUrl: part.photos[0]?.thumbUrl ?? part.video?.posterUrl ?? null,
					shopName: part.shop.name,
				}
				set((s) => ({ items: [item, ...s.items.filter((x) => x.id !== part.id)].slice(0, MAX) }))
			},
			clear: () => set({ items: [] }),
		}),
		{ name: 'parts.viewed', storage: createJSONStorage(() => localJsonStorage) }
	)
)
