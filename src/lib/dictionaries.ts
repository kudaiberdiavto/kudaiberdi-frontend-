// Dictionaries (brands, models, categories, service types, hints) change in the admin panel.
// GET /dictionaries/version grows on every edit — when it does, drop the cached lists so they reload.
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { apiFetch } from '@/lib/api'
import { readJson, writeJson } from '@/lib/local-json'
import { queryClient } from '@/lib/query-client'
import { serviceKeys } from '@/api/keys'

const FILE = 'dict.version'

async function checkVersion() {
	try {
		const { version } = await apiFetch<{ version: number; updatedAt: string }>('/dictionaries/version', { auth: false })
		const saved = await readJson<{ version: number }>(FILE)
		if (saved && saved.version !== version) {
			queryClient.invalidateQueries({ queryKey: ['directory'] })
			queryClient.invalidateQueries({ queryKey: serviceKeys.types })
			queryClient.invalidateQueries({ queryKey: ['requests', 'hints'] })
		}
		if (saved?.version !== version) writeJson(FILE, { version })
	} catch {
		// Offline — keep what we have.
	}
}

/** On start and every time the app comes back to the foreground. */
export function useDictionariesVersion() {
	useEffect(() => {
		checkVersion()
		const subscription = AppState.addEventListener('change', (state) => state === 'active' && checkVersion())
		return () => subscription.remove()
	}, [])
}
