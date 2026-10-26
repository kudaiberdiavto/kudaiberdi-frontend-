import { create } from 'zustand'

/**
 * The full-screen video feed (/videos). `startPartId` — the video tapped (home screen, catalog): the feed opens on
 * it. `byCar` — «✓ Camry 50»: the main car's videos first.
 */
interface VideoViewerState {
	startPartId: number | null
	byCar: boolean
	openVideo: (partId: number) => void
	clearStart: () => void
	setByCar: (byCar: boolean) => void
}

export const useVideoViewer = create<VideoViewerState>((set) => ({
	startPartId: null,
	byCar: true,
	openVideo: (partId) => set({ startPartId: partId }),
	clearStart: () => set({ startPartId: null }),
	setByCar: (byCar) => set({ byCar }),
}))
