import { create } from 'zustand'
import { router } from 'expo-router'
import { type ApiLang, apiFetch, configureApi, getRefreshToken, loadTokens, saveTokens } from '@/lib/api'
import { getItem, setItem } from '@/lib/secure-storage'
import { clearQueryCache, queryClient } from '@/lib/query-client'
import type { Lang, Me, TokenResponse, UserRole } from '@/api/types'
import { meKeys } from '@/api/keys'
import { setAppLang } from '@/i18n'

// Client-side session state only: whether we are signed in, who, and the UI
// language. The profile itself lives in TanStack Query (`meKeys.me`).

type Status = 'booting' | 'guest' | 'authed'

interface Snapshot {
	userId: number
	role: UserRole | null
	onboarded: boolean
	hasShop: boolean
	hasMaster: boolean
}

const LANG_KEY = 'app.lang'
const SNAPSHOT_KEY = 'auth.user'

export const toApiLang = (lang: Lang | null | undefined): ApiLang => (lang === 'KG' ? 'ky' : 'ru')
export const toLang = (lang: ApiLang): Lang => (lang === 'ky' ? 'KG' : 'RU')

interface SessionState {
	status: Status
	userId: number | null
	role: UserRole | null
	/** false — role not chosen yet (the backend pre-fills BUYER), screen 03. */
	onboarded: boolean
	hasShop: boolean
	/** Has a master profile — in the MASTER role without one the app opens 38. */
	hasMaster: boolean
	lang: ApiLang
	/** App start: saved tokens → GET /me. */
	boot: () => Promise<void>
	setLang: (lang: ApiLang) => void
	/** After POST /auth/otp/verify. */
	signIn: (response: TokenResponse) => Promise<void>
	/** Keeps the cached profile in sync after PUT /me/role, GET /me. */
	setUser: (me: Me) => void
	signOut: () => Promise<void>
	/** Refresh token rejected — drop everything and go to screen 01. */
	expire: () => void
}

async function persistSnapshot(snapshot: Snapshot | null) {
	await setItem(SNAPSHOT_KEY, snapshot ? JSON.stringify(snapshot) : null)
}

async function clearSession() {
	await saveTokens(null)
	await persistSnapshot(null)
	await clearQueryCache()
}

function goToStart() {
	try {
		router.replace('/')
	} catch {}
}

export const useSession = create<SessionState>((set, get) => ({
	status: 'booting',
	userId: null,
	role: null,
	onboarded: false,
	hasShop: false,
	hasMaster: false,
	lang: 'ru',

	boot: async () => {
		const savedLang = await getItem(LANG_KEY)
		if (savedLang === 'ru' || savedLang === 'ky') {
			setAppLang(savedLang)
			set({ lang: savedLang })
		}

		if (!(await loadTokens())) {
			set({ status: 'guest' })
			return
		}

		// Route from the last known snapshot right away (works offline),
		// then confirm with GET /me.
		const raw = await getItem(SNAPSHOT_KEY)
		const snapshot = raw ? (JSON.parse(raw) as Snapshot) : null
		set({
			status: 'authed',
			userId: snapshot?.userId ?? null,
			role: snapshot?.role ?? null,
			onboarded: snapshot?.onboarded ?? false,
			hasShop: snapshot?.hasShop ?? false,
			hasMaster: snapshot?.hasMaster ?? false,
		})

		try {
			const me = await queryClient.fetchQuery({ queryKey: meKeys.me, queryFn: () => apiFetch<Me>('/me') })
			get().setUser(me)
		} catch {
			// Offline: keep the snapshot. Expired session: `expire` already ran.
			if (!snapshot && get().status === 'authed') set({ status: 'guest' })
		}
	},

	setLang: (lang) => {
		setAppLang(lang)
		set({ lang })
		setItem(LANG_KEY, lang)
	},

	signIn: async (response) => {
		await saveTokens(response)
		// The language picked on the sign-in screen wins over the one saved in the profile — and is saved there.
		const lang = toLang(get().lang)
		const user = response.user.lang === lang ? response.user : { ...response.user, lang }
		if (user !== response.user) apiFetch('/me', { method: 'PATCH', body: { lang } }).catch(() => {})
		queryClient.setQueryData(meKeys.me, user)
		get().setUser(user)
		set({ status: 'authed' })
	},

	setUser: (me) => {
		queryClient.setQueryData(meKeys.me, me)
		const snapshot = { userId: me.id, role: me.role ?? null, onboarded: me.onboarded, hasShop: me.hasShop, hasMaster: me.hasMaster }
		set(snapshot)
		get().setLang(toApiLang(me.lang))
		persistSnapshot(snapshot)
	},

	signOut: async () => {
		// Stop this device's pushes before the session (and its token) is gone.
		await (await import('@/lib/push')).unregisterDevice()
		const refreshToken = getRefreshToken()
		if (refreshToken) {
			await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {})
		}
		await clearSession()
		set({ status: 'guest', userId: null, role: null, onboarded: false, hasShop: false, hasMaster: false })
		goToStart()
	},

	expire: () => {
		clearSession()
		set({ status: 'guest', userId: null, role: null, onboarded: false, hasShop: false, hasMaster: false })
		goToStart()
	},
}))

configureApi({
	getLang: () => useSession.getState().lang,
	onSessionExpired: () => useSession.getState().expire(),
})

/**
 * Where a signed-in user lands: role not chosen → 03, buyer → 05,
 * seller without a box → 10а, seller → 11, master without a profile → 38, master → 39.
 */
export function homeHref({ role, onboarded, hasShop, hasMaster }: Pick<Snapshot, 'role' | 'onboarded' | 'hasShop' | 'hasMaster'>) {
	if (!onboarded || !role) return '/role' as const
	if (role === 'MASTER') return hasMaster ? ('/master' as const) : ('/master-profile' as const)
	if (role === 'BUYER') return '/buyer' as const
	return hasShop ? ('/seller' as const) : ('/box-select' as const)
}
