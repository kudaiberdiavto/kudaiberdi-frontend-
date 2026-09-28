import { create } from 'zustand'
import { setAccessToken } from '@/lib/api'

// Example of the Zustand pattern for local/client state (auth, UI toggles) —
// server data (requests, chats, etc.) belongs in TanStack Query instead,
// not here.
interface AuthState {
	userId: number | null
	login: (userId: number, token: string) => void
	logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
	userId: null,
	login: (userId, token) => {
		setAccessToken(token)
		set({ userId })
	},
	logout: () => {
		setAccessToken(null)
		set({ userId: null })
	},
}))
