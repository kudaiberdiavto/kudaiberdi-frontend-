import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localJsonStorage } from '@/lib/local-json'

// Playback speed of voice notes — one for all of them, remembered (as in Telegram / WhatsApp).

export const VOICE_SPEEDS = [1, 1.5, 2] as const
export type VoiceSpeed = (typeof VOICE_SPEEDS)[number]

interface VoiceSpeedState {
	speed: VoiceSpeed
	next: () => void
}

export const useVoiceSpeed = create<VoiceSpeedState>()(
	persist(
		(set, get) => ({
			speed: 1,
			next: () => set({ speed: VOICE_SPEEDS[(VOICE_SPEEDS.indexOf(get().speed) + 1) % VOICE_SPEEDS.length] }),
		}),
		{ name: 'voice.speed', storage: createJSONStorage(() => localJsonStorage) }
	)
)
