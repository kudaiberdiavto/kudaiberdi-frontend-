// Chats [08, 13, 16]: list, history, sending, read receipts, quick replies.
// Live delivery comes over Centrifugo (src/lib/realtime.tsx, useChatChannel).
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, compressPhoto, fileFormData, newIdempotencyKey, uploadForm } from '@/lib/api'
import { chatKeys } from './keys'
import { cursorPaging } from './pagination'
import type { Chat, ChatListItem, ChatListPage, ChatMessage, MessagePage, QuickReply, SendMessageBody, Unread } from './types'

/** Message side (`mySide`). A master writes as `SHOP`. */
export type ChatSide = 'BUYER' | 'SHOP'
/** Whose chats to list: `MASTER` — the master's chats with clients. */
export type ChatListAs = ChatSide | 'MASTER'

/** Chats list [16] — buyer's, the box's or the master's chats. */
export function useChats(as: ChatListAs) {
	return useInfiniteQuery({
		queryKey: [...chatKeys.list, as],
		queryFn: ({ pageParam, signal }) => apiFetch<ChatListPage>('/chats', { query: { as, cursor: pageParam }, signal }),
		...cursorPaging,
	})
}

/** Tab badges; kept live by the UNREAD event. */
export function useUnread(enabled = true) {
	return useQuery({
		queryKey: chatKeys.unread,
		queryFn: ({ signal }) => apiFetch<Unread>('/chats/unread', { signal }),
		enabled,
	})
}

export function useChat(id: number) {
	return useQuery({
		queryKey: chatKeys.detail(id),
		queryFn: ({ signal }) => apiFetch<Chat>(`/chats/${id}`, { signal }),
		enabled: id > 0,
		// «в сети» / «был(а) 5 мин назад» in the header stays fresh while the chat is open.
		refetchInterval: 30_000,
	})
}

/** History, newest first; the cursor goes back in time. */
export function useChatMessages(id: number) {
	return useInfiniteQuery({
		queryKey: chatKeys.messages(id),
		queryFn: ({ pageParam, signal }) =>
			apiFetch<MessagePage>(`/chats/${id}/messages`, { query: { cursor: pageParam }, signal }),
		...cursorPaging,
		enabled: id > 0,
	})
}

/** Quick replies for my side: MESSAGE — sent as is, ACTION — handled by the app (route, close). */
export function useQuickReplies(id: number) {
	return useQuery({
		queryKey: chatKeys.quickReplies(id),
		queryFn: ({ signal }) => apiFetch<QuickReply[]>(`/chats/${id}/quick-replies`, { signal }),
		enabled: id > 0,
		staleTime: 10 * 60_000,
	})
}

type MessagesData = InfiniteData<MessagePage, string | undefined>

/**
 * Put a message at the top of the history — from the server (REST or MESSAGE event) or an
 * optimistic one. Matches by `id`, then by `clientId`, so an event never duplicates a sent message.
 */
export function upsertMessage(data: MessagesData | undefined, message: ChatMessage): MessagesData | undefined {
	if (!data) return data
	const pages = data.pages.map((page) => ({
		...page,
		items: page.items.filter(
			(m) => m.id !== message.id && !(message.clientId && m.clientId === message.clientId)
		),
	}))
	pages[0] = { ...pages[0], items: [message, ...pages[0].items] }
	return { ...data, pages }
}

/** Bring a chat row to the top of the list after a new message or a CHAT event. */
export function upsertChatRow(
	data: InfiniteData<ChatListPage, string | undefined> | undefined,
	row: ChatListItem
): InfiniteData<ChatListPage, string | undefined> | undefined {
	if (!data) return data
	const pages = data.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== row.id) }))
	pages[0] = { ...pages[0], items: [row, ...pages[0].items] }
	return { ...data, pages }
}

/**
 * Send text or a quick reply. `clientId` doubles as the idempotency key: a retry after a
 * dropped connection returns the same message. The message shows up right away (optimistic).
 */
export function useSendMessage(chatId: number, mySide: ChatSide) {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationFn: (body: SendMessageBody & { clientId: string }) =>
			apiFetch<ChatMessage>(`/chats/${chatId}/messages`, { method: 'POST', body }),
		onMutate: (body) => {
			const optimistic: ChatMessage = {
				id: -Date.now(),
				chatId,
				side: mySide,
				senderId: null,
				type: body.quickReply ? 'QUICK' : 'TEXT',
				text: body.text ?? null,
				code: body.quickReply ?? null,
				payload: null,
				mediaUrl: null,
				mimeType: null,
				durationSeconds: null,
				waveform: null,
				clientId: body.clientId,
				read: false,
				createdAt: new Date().toISOString(),
			}
			queryClient.setQueryData<MessagesData>(chatKeys.messages(chatId), (data) => upsertMessage(data, optimistic))
		},
		onSuccess: (message) => {
			queryClient.setQueryData<MessagesData>(chatKeys.messages(chatId), (data) => upsertMessage(data, message))
			queryClient.invalidateQueries({ queryKey: chatKeys.list })
		},
	})

	/** `send({text})` / `send({quickReply})`; `retry` resends a failed message with the same clientId. */
	return {
		...mutation,
		send: (body: Omit<SendMessageBody, 'clientId'>) => mutation.mutate({ ...body, clientId: newIdempotencyKey() }),
		retry: (message: ChatMessage) =>
			message.clientId &&
			mutation.mutate({ text: message.text ?? undefined, quickReply: (message.code as SendMessageBody['quickReply']) ?? undefined, clientId: message.clientId }),
	}
}

export interface MediaAttachment {
	type: 'PHOTO' | 'VOICE' | 'VIDEO'
	uri: string
	/** MIME of the local file: image/…, audio/…, video/…. */
	mimeType: string
	durationSeconds?: number
	/** VOICE: up to 100 loudness peaks 0…1. */
	waveform?: number[]
}

/**
 * Photo, voice (up to 60 s) or video — multipart POST /chats/{id}/messages/media.
 * Photos are shrunk to 1080 px JPEG first (slow market internet). Shows up at once (optimistic).
 */
export function useSendMedia(chatId: number, mySide: ChatSide) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ clientId, ...media }: MediaAttachment & { clientId: string }) => {
			const photo = media.type === 'PHOTO'
			const uri = photo ? await compressPhoto(media.uri) : media.uri
			const mime = photo ? 'image/jpeg' : media.mimeType
			const extension = mime.split('/')[1]?.split(';')[0] || 'bin'
			const makeForm = () =>
				fileFormData(
					uri,
					{ name: `${media.type.toLowerCase()}.${extension}`, type: mime },
					{
						type: media.type,
						durationSeconds: media.durationSeconds ? String(Math.round(media.durationSeconds)) : undefined,
						waveform: media.waveform ? JSON.stringify(media.waveform) : undefined,
						clientId,
					}
				)
			// XHR, not fetch: no 20 s timeout — a video from the gallery uploads longer than that.
			return uploadForm<ChatMessage>(`/chats/${chatId}/messages/media`, makeForm)
		},
		onMutate: ({ clientId, ...media }) => {
			const optimistic: ChatMessage = {
				id: -Date.now(),
				chatId,
				side: mySide,
				senderId: null,
				type: media.type,
				text: null,
				code: null,
				payload: null,
				mediaUrl: media.uri,
				mimeType: media.mimeType,
				durationSeconds: media.durationSeconds ? Math.round(media.durationSeconds) : null,
				waveform: media.waveform ?? null,
				clientId,
				read: false,
				createdAt: new Date().toISOString(),
			}
			queryClient.setQueryData<MessagesData>(chatKeys.messages(chatId), (data) => upsertMessage(data, optimistic))
		},
		onSuccess: (message) => {
			queryClient.setQueryData<MessagesData>(chatKeys.messages(chatId), (data) => upsertMessage(data, message))
			queryClient.invalidateQueries({ queryKey: chatKeys.list })
		},
	})
}

/** «Прочитано» up to the newest message. */
export function useMarkRead(chatId: number) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (upToMessageId: number) =>
			apiFetch<void>(`/chats/${chatId}/read`, { method: 'POST', body: { upToMessageId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatKeys.unread })
			queryClient.invalidateQueries({ queryKey: chatKeys.list })
		},
	})
}

/** POST /chats — the one chat with this shop, pinned to a request or a part. */
export function useOpenChat() {
	const queryClient = useQueryClient()
	return useMutation({
		// One of `shopId` / `masterId`; a master chat may be pinned to a service request.
		mutationFn: (body: { shopId?: number; masterId?: number; requestId?: number; serviceRequestId?: number; partId?: number }) =>
			apiFetch<Chat>('/chats', { method: 'POST', body }),
		onSuccess: (chat) => {
			queryClient.setQueryData(chatKeys.detail(chat.id), chat)
			queryClient.invalidateQueries({ queryKey: chatKeys.list })
		},
	})
}
