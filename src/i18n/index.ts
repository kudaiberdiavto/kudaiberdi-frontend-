import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { ky } from './ky'

export type AppLang = 'ru' | 'ky'

/** Same key the session keeps the language under. */
const LANG_KEY = 'app.lang'

/** Read synchronously at start, so texts in module-level constants come out in the saved language too. */
function readSaved(): AppLang {
	try {
		const saved = Platform.OS === 'web' ? globalThis.localStorage?.getItem(LANG_KEY) : SecureStore.getItem(LANG_KEY)
		return saved === 'ky' ? 'ky' : 'ru'
	} catch {
		return 'ru'
	}
}

let current: AppLang = readSaved()

export function getAppLang(): AppLang {
	return current
}

/** The session calls it on a language change; the root layout then remounts the screens (key={lang}). */
export function setAppLang(lang: AppLang) {
	current = lang
}

/**
 * The Russian text is the key: `t('Отправить запрос')`; `{0}`, `{1}` — the values after it.
 * A text missing from the Kyrgyz dictionary stays Russian.
 */
export function t(ru: string, ...values: (string | number | null | undefined)[]): string {
	const text = current === 'ky' ? (ky[ru] ?? ru) : ru
	return values.length ? text.replace(/\{(\d+)\}/g, (_, i: string) => String(values[Number(i)] ?? '')) : text
}
