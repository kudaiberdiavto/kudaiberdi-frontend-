import { create } from 'zustand'

/**
 * The full-screen video feed (/videos). `startPartId` — the video tapped (home screen, catalog): the feed opens on
 * it.
 */
interface VideoViewerState {
	startPartId: number | null
	openVideo: (partId: number) => void
	clearStart: () => void
}

export const useVideoViewer = create<VideoViewerState>((set) => ({
	startPartId: null,
	openVideo: (partId) => set({ startPartId: partId }),
	clearStart: () => set({ startPartId: null }),
}))
