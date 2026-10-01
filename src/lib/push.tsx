// Push notifications (FCM on the backend). Registers the device after sign-in,
// routes taps by `data.type`, and answers «Нет» / «Не моё» straight from the NEW_REQUEST / NEW_SERVICE_REQUEST push.

import { type ReactNode, useEffect } from 'react'
import { Platform } from 'react-native'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { apiFetch } from '@/lib/api'
import { getItem, setItem } from '@/lib/secure-storage'
import { queryClient } from '@/lib/query-client'
import { useSession } from '@/store/useSession'
import { chatKeys, masterKeys, shopKeys } from '@/api/keys'
import type { Chat, Me } from '@/api/types'

const TOKEN_KEY = 'push.token'

/** Payload the backend puts into `data` (all values are strings). */
interface PushData {
	type?: string
	requestId?: string
	chatId?: string
	partId?: string
	shopId?: string
	/** ACCOUNT_STATUS: `SHOP` / `MASTER`, `event` APPROVED / REJECTED / BLOCKED / UNBLOCKED. */
	target?: string
	event?: string
	/** DISPUTE_RESOLVED: «true» / «false». */
	won?: string
}

// Expo Go has no device push tokens (Android since SDK 53) — push works in the dev / release build.
const pushAvailable = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient

if (Platform.OS !== 'web') {
	Notifications.setNotificationHandler({
		handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
	})
	// «Есть / Нет» on a new request [14]: «Нет» answers in the background, «Есть» opens 12 (it needs the condition).
	Notifications.setNotificationCategoryAsync('NEW_REQUEST', [
		{ identifier: 'HAVE', buttonTitle: 'Есть', options: { opensAppToForeground: true } },
		{ identifier: 'NOT_HAVE', buttonTitle: 'Нет', options: { opensAppToForeground: false } },
	]).catch(() => {})
	// «Могу помочь / Не моё» on a new service request [39]: «Не моё» answers in the background.
	Notifications.setNotificationCategoryAsync('NEW_SERVICE_REQUEST', [
		{ identifier: 'CAN_HELP', buttonTitle: 'Могу помочь', options: { opensAppToForeground: true } },
		{ identifier: 'NOT_MINE', buttonTitle: 'Не моё', options: { opensAppToForeground: false } },
	]).catch(() => {})
}

/** Device token → POST /devices. Android: the FCM token; iOS: see BACKEND_QUESTIONS.md (APNs). */
async function registerDevice() {
	if (!pushAvailable) return
	const permission = await Notifications.requestPermissionsAsync()
	if (!permission.granted) return
	const { data: token } = await Notifications.getDevicePushTokenAsync()
	if (typeof token !== 'string' || !token) return
	await apiFetch('/devices', { method: 'POST', body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' } })
	await setItem(TOKEN_KEY, token)
}

/** On sign-out: the device stops getting this user's pushes. */
export async function unregisterDevice() {
	const token = await getItem(TOKEN_KEY)
	if (!token) return
	await apiFetch(`/devices/${encodeURIComponent(token)}`, { method: 'DELETE' }).catch(() => {})
	await setItem(TOKEN_KEY, null)
}

/** Where a push leads (contract, section 1). */
async function openPush(data: PushData) {
	const requestId = data.requestId ?? ''
	switch (data.type) {
		case 'NEW_REQUEST':
			return router.push({ pathname: '/seller-answer', params: { id: requestId } })
		case 'REPLY_HAVE':
			return router.push({ pathname: '/buyer/requests', params: { id: requestId } })
		case 'NO_REPLY':
			return router.push({ pathname: '/empty', params: { id: requestId } })
		case 'REQUEST_EXPIRED':
			return router.push({ pathname: '/request-stats', params: { id: requestId } })
		case 'SALE':
			return router.push('/seller')
		case 'PRICE_DROP':
		case 'OUT_OF_STOCK':
			return router.push({ pathname: '/part', params: { id: data.partId ?? '' } })
		case 'NEW_SERVICE_REQUEST':
		case 'SERVICE_DEAL':
			return router.push('/master')
		case 'SERVICE_OFFER':
		case 'SERVICE_NO_OFFERS':
		case 'SERVICE_EXPIRED':
			return router.push({ pathname: '/service-offers', params: { id: requestId } })
		// Administration [contract §1]: the account status changed — refresh the session and open the profile.
		case 'ACCOUNT_STATUS': {
			const me = await apiFetch<Me>('/me').catch(() => null)
			if (me) useSession.getState().setUser(me)
			queryClient.invalidateQueries({ queryKey: data.target === 'MASTER' ? masterKeys.profile : shopKeys.my })
			return router.push(data.target === 'MASTER' ? '/master/profile' : '/seller/box')
		}
		// A container dispute: won — the box is yours now; lost — pick another one.
		case 'DISPUTE_RESOLVED':
			queryClient.invalidateQueries({ queryKey: shopKeys.my })
			return router.push(data.won === 'true' ? '/seller/box' : '/box-select')
		// The text is the push itself; nothing to open — just bring the app to its home.
		case 'ADMIN_MESSAGE':
		case 'COMPLAINT_RESOLVED':
			return
		case 'CHAT_MESSAGE': {
			// The payload has no side — the chat itself says whether I am the buyer or the box.
			const chatId = Number(data.chatId)
			const chat = await queryClient
				.fetchQuery({ queryKey: chatKeys.detail(chatId), queryFn: () => apiFetch<Chat>(`/chats/${chatId}`) })
				.catch(() => null)
			return router.push({
				pathname: chat?.mySide === 'SHOP' ? '/seller-chat' : '/chat',
				params: { chatId: String(chatId) },
			})
		}
	}
}

async function handleResponse(response: Notifications.NotificationResponse) {
	const data = (response.notification.request.content.data ?? {}) as PushData
	if (response.actionIdentifier === 'NOT_HAVE' && data.requestId) {
		await apiFetch(`/requests/${data.requestId}/replies`, {
			method: 'POST',
			body: { answer: 'NOT_HAVE' },
			idempotencyKey: `push-${response.notification.request.identifier}`,
		}).catch(() => {})
		return
	}
	if (response.actionIdentifier === 'NOT_MINE' && data.requestId) {
		await apiFetch(`/my/master/requests/${data.requestId}/offer`, {
			method: 'POST',
			body: { answer: 'NOT_MINE' },
			idempotencyKey: `push-${response.notification.request.identifier}`,
		}).catch(() => {})
		return
	}
	await openPush(data)
}

/** Registers the device while signed in and handles taps (also the one that cold-started the app). */
export function PushProvider({ children }: { children: ReactNode }) {
	const signedIn = useSession((s) => s.status === 'authed')
	const userId = useSession((s) => s.userId)

	useEffect(() => {
		if (signedIn && userId !== null) registerDevice().catch(() => {})
	}, [signedIn, userId])

	useEffect(() => {
		if (!signedIn || Platform.OS === 'web') return
		Notifications.getLastNotificationResponseAsync()
			.then((response) => response && handleResponse(response))
			.catch(() => {})
		const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
			handleResponse(response).catch(() => {})
		})
		return () => subscription.remove()
	}, [signedIn])

	return children
}
