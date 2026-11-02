import * as StoreReview from 'expo-store-review'
import { getItem, setItem } from '@/lib/secure-storage'

// The App Store / Google Play rating sheet — asked right after a deal went well (bought, parcel received),
// when people are most likely to rate high. At most once in 4 months; the stores add their own limits on top.

const KEY = 'review.askedAt'
const EVERY_MS = 120 * 24 * 60 * 60 * 1000

export async function askForReview() {
	try {
		if (!(await StoreReview.isAvailableAsync())) return
		const asked = Number(await getItem(KEY))
		if (asked && Date.now() - asked < EVERY_MS) return
		await setItem(KEY, String(Date.now()))
		// Let the «спасибо» toast and the screen change land first.
		setTimeout(() => StoreReview.requestReview().catch(() => {}), 1500)
	} catch {}
}
