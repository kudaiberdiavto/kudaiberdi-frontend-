import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// expo-secure-store has no web implementation — on web fall back to
// localStorage (dev only; the product ships as a mobile app).
const isWeb = Platform.OS === 'web'

export async function getItem(key: string): Promise<string | null> {
	if (isWeb) {
		try {
			return globalThis.localStorage?.getItem(key) ?? null
		} catch {
			return null
		}
	}
	return SecureStore.getItemAsync(key)
}

export async function setItem(key: string, value: string | null): Promise<void> {
	if (isWeb) {
		try {
			if (value === null) globalThis.localStorage?.removeItem(key)
			else globalThis.localStorage?.setItem(key, value)
		} catch {}
		return
	}
	if (value === null) await SecureStore.deleteItemAsync(key)
	else await SecureStore.setItemAsync(key, value)
}
