// Live events over Centrifugo (not STOMP, not a custom WebSocket).
// One connection per signed-in session with the personal inbox channel;
// REST stays the source of truth — after a reconnect the open screen refetches.

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Centrifuge, type Subscription, UnauthorizedError } from 'centrifuge'
import { create } from 'zustand'
import { ApiError, apiFetch } from '@/lib/api'
import { CENTRIFUGO_URL } from '@/lib/env'
import { queryClient } from '@/lib/query-client'
import { useSession } from '@/store/useSession'
import { chatKeys, requestKeys, serviceKeys } from '@/api/keys'
import { upsertChatRow, upsertMessage } from '@/api/chats'
import type { Chat, ChatListItem, ChatListPage, ChatMessage, MessagePage, RealtimeToken, RequestStats, ServiceStats } from '@/api/types'
import type { InfiniteData } from '@tanstack/react-query'

/** Every event is `{type, payload}`. */
export interface RealtimeEvent<T = unknown> {
	type: string
	payload: T
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected'

interface RealtimeState {
	client: Centrifuge | null
	state: ConnectionState
}

export const useRealtime = create<RealtimeState>(() => ({ client: null, state: 'disconnected' }))

/** GET /realtime/token — also the SDK's `getToken` for renewal. */
async function fetchConnectionToken() {
	try {
		return (await apiFetch<RealtimeToken>('/realtime/token')).token
	} catch (error) {
		// Session is gone — tell the SDK to stop reconnecting.
		if (error instanceof ApiError && (error.status === 401 || error.status === 403)) throw new UnauthorizedError('')
		throw error
	}
}

/** Personal channel events: `CHAT`, `UNREAD`, `REQUEST_STATS`, `SERVICE_REQUEST_STATS`. */
function onInboxEvent({ type, payload }: RealtimeEvent) {
	switch (type) {
		case 'REQUEST_STATS': {
			const stats = payload as RequestStats
			queryClient.setQueryData(requestKeys.stats(stats.requestId), stats)
			// New «Есть» answers change the detail, the replies and the badge on 05.
			queryClient.invalidateQueries({ queryKey: requestKeys.detail(stats.requestId), exact: true })
			queryClient.invalidateQueries({ queryKey: requestKeys.replies(stats.requestId) })
			queryClient.invalidateQueries({ queryKey: requestKeys.myAll })
			break
		}
		case 'SERVICE_REQUEST_STATS': {
			const stats = payload as ServiceStats
			queryClient.setQueryData(serviceKeys.stats(stats.requestId), stats)
			// A new «Могу помочь» → the offers list [37] and the badge on 05б.
			queryClient.invalidateQueries({ queryKey: serviceKeys.offers(stats.requestId) })
			queryClient.invalidateQueries({ queryKey: serviceKeys.detail(stats.requestId), exact: true })
			queryClient.invalidateQueries({ queryKey: serviceKeys.my })
			break
		}
		case 'UNREAD':
			queryClient.setQueryData(chatKeys.unread, payload)
			break
		case 'CHAT': {
			// The updated row of the chats list [16] — move it to the top of its side's list.
			const row = payload as ChatListItem
			// A master writes as SHOP, but the master's chats are listed `as=MASTER`.
			const list = row.mySide === 'SHOP' && row.masterId ? 'MASTER' : row.mySide
			queryClient.setQueryData<InfiniteData<ChatListPage, string | undefined>>([...chatKeys.list, list], (data) =>
				upsertChatRow(data, row)
			)
			break
		}
	}
}

interface ReadPayload {
	chatId: number
	side: 'BUYER' | 'SHOP' | 'SYSTEM'
	readMessageId: number
}

/**
 * The open chat's channel `chat:{chatId}` [08, 13] — subscribed while the screen is mounted,
 * with a token from GET /chats/{id}/subscription-token. MESSAGE → history, READ → «прочитано»,
 * TYPING → «печатает…» (published by the client itself).
 */
export function useChatChannel(chatId: number, mySide: 'BUYER' | 'SHOP', onMessage?: (message: ChatMessage) => void) {
	const client = useRealtime((s) => s.client)
	const [typing, setTyping] = useState(false)
	const subscription = useRef<Subscription | null>(null)
	const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastTypingSent = useRef(0)
	const onMessageRef = useRef(onMessage)
	useEffect(() => {
		onMessageRef.current = onMessage
	}, [onMessage])

	useEffect(() => {
		if (!client || chatId <= 0) return
		const channel = `chat:${chatId}`
		const sub =
			client.getSubscription(channel) ??
			client.newSubscription(channel, {
				getToken: async () => (await apiFetch<RealtimeToken>(`/chats/${chatId}/subscription-token`)).token,
			})

		sub.on('publication', (ctx) => {
			const event = ctx.data as RealtimeEvent
			if (event.type === 'MESSAGE') {
				const message = event.payload as ChatMessage
				queryClient.setQueryData<InfiniteData<MessagePage, string | undefined>>(chatKeys.messages(chatId), (data) =>
					upsertMessage(data, message)
				)
				if (message.side !== mySide) {
					setTyping(false)
					onMessageRef.current?.(message)
				}
			} else if (event.type === 'READ') {
				const read = event.payload as ReadPayload
				if (read.side === mySide) return
				queryClient.setQueryData<Chat>(chatKeys.detail(chatId), (chat) =>
					chat ? { ...chat, otherReadMessageId: Math.max(chat.otherReadMessageId, read.readMessageId) } : chat
				)
			} else if (event.type === 'TYPING') {
				const side = (event.payload as { side?: string })?.side
				if (side === mySide) return
				setTyping(true)
				if (typingTimer.current) clearTimeout(typingTimer.current)
				typingTimer.current = setTimeout(() => setTyping(false), 4000)
			}
		})
		// Channel history covers short drops; after a longer one REST is re-read.
		sub.on('subscribed', (ctx) => {
			if (ctx.wasRecovering && !ctx.recovered) queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) })
		})
		sub.subscribe()
		subscription.current = sub

		return () => {
			sub.removeAllListeners()
			sub.unsubscribe()
			client.removeSubscription(sub)
			subscription.current = null
			if (typingTimer.current) clearTimeout(typingTimer.current)
		}
	}, [client, chatId, mySide])

	/** Call on every keystroke — sends TYPING at most once per 3 s. */
	const publishTyping = useCallback(() => {
		const now = Date.now()
		if (!subscription.current || now - lastTypingSent.current < 3000) return
		lastTypingSent.current = now
		subscription.current.publish({ type: 'TYPING', payload: { chatId, side: mySide } }).catch(() => {})
	}, [chatId, mySide])

	return { typing, publishTyping }
}

function connect(userId: number) {
	const client = new Centrifuge(CENTRIFUGO_URL, { getToken: fetchConnectionToken })
	let connectedBefore = false

	// Centrifugo lets only this user into `inbox:{id}#{id}` — no subscription token needed.
	const inbox = client.newSubscription(`inbox:${userId}#${userId}`)
	inbox.on('publication', (ctx) => onInboxEvent(ctx.data as RealtimeEvent))
	inbox.subscribe()

	client.on('connecting', () => useRealtime.setState({ state: 'connecting' }))
	client.on('disconnected', () => useRealtime.setState({ state: 'disconnected' }))
	client.on('connected', () => {
		useRealtime.setState({ state: 'connected' })
		// Channel history covers short drops, but only REST is authoritative:
		// refetch whatever is on screen after a reconnect.
		if (connectedBefore) queryClient.invalidateQueries({ refetchType: 'active' })
		connectedBefore = true
	})

	client.connect()
	useRealtime.setState({ client })
	return client
}

/** Keeps one Centrifugo connection open while the user is signed in. */
export function RealtimeProvider({ children }: { children: ReactNode }) {
	const signedIn = useSession((s) => s.status === 'authed')
	const userId = useSession((s) => s.userId)

	useEffect(() => {
		if (!signedIn || userId === null) return
		const client = connect(userId)
		return () => {
			client.disconnect()
			client.removeAllListeners()
			useRealtime.setState({ client: null, state: 'disconnected' })
		}
	}, [signedIn, userId])

	return children
}
