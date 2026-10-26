import { create } from 'zustand'

/**
 * Tab «Рынок» of the buyer: «Видео» (the feed) or «Карта рынка». `startPartId` — the video tapped on the home
 * screen: the feed opens on it. `byCar` — «✓ Camry 50»: the main car's videos first.
 */
interface MarketTabState {
	mode: 'video' | 'map'
	startPartId: number | null
	byCar: boolean
	setMode: (mode: 'video' | 'map') => void
	openVideo: (partId: number) => void
	clearStart: () => void
	setByCar: (byCar: boolean) => void
}

export const useMarketTab = create<MarketTabState>((set) => ({
	mode: 'video',
	startPartId: null,
	byCar: true,
	setMode: (mode) => set({ mode }),
	openVideo: (partId) => set({ mode: 'video', startPartId: partId }),
	clearStart: () => set({ startPartId: null }),
	setByCar: (byCar) => set({ byCar }),
}))
