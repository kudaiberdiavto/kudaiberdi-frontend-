import { Platform } from 'react-native'
import { File, Paths } from 'expo-file-system'
import type { StateStorage } from 'zustand/middleware'

// Small JSON documents kept on the device (drafts, stubs): a file in the app's documents
// on iOS/Android, localStorage on web. Not for secrets — those go to secure-storage.

export async function readJson<T>(name: string): Promise<T | null> {
	try {
		if (Platform.OS === 'web') {
			const raw = globalThis.localStorage?.getItem(name)
			return raw ? (JSON.parse(raw) as T) : null
		}
		const file = new File(Paths.document, `${name}.json`)
		return file.exists ? (JSON.parse(await file.text()) as T) : null
	} catch {
		return null
	}
}

export function writeJson(name: string, value: unknown) {
	try {
		if (Platform.OS === 'web') {
			if (value === null) globalThis.localStorage?.removeItem(name)
			else globalThis.localStorage?.setItem(name, JSON.stringify(value))
			return
		}
		const file = new File(Paths.document, `${name}.json`)
		if (value === null) {
			if (file.exists) file.delete()
		} else file.write(JSON.stringify(value))
	} catch {}
}

/** zustand `persist` storage over the same files. */
export const localJsonStorage: StateStorage = {
	getItem: async (name) => {
		const value = await readJson<unknown>(name)
		return value === null ? null : JSON.stringify(value)
	},
	setItem: (name, value) => writeJson(name, JSON.parse(value)),
	removeItem: (name) => writeJson(name, null),
}
