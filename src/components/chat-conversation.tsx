import { type ReactNode, useEffect, useRef, useState } from 'react'
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { QueryErrorBanner } from '@/components/ui'
import * as ImagePicker from 'expo-image-picker'
import { SendIcon } from '@/components/icons'
import { CameraV23Icon, MicV23Icon, TickIcon } from '@/components/buyer-v23'
import { VoicePlayer } from '@/components/voice'
import { TruckTile } from '@/components/video-v23'
import { RecordingBar, useVoiceRecorder, VideoBubble } from '@/components/chat-media'
import { fontFamily, raw, useColors } from '@/theme'
import { newIdempotencyKey, resolveUrl } from '@/lib/api'
import { formatClock, formatPrice, formatWhenAt } from '@/lib/format'
import { useRealtime, useChatChannel } from '@/lib/realtime'
import { flattenPages } from '@/api/pagination'
import { type ChatSide, useChat, useChatMessages, useMarkRead, useQuickReplies, useSendMedia, useSendMessage } from '@/api/chats'
import type { ChatMessage, QuickReply } from '@/api/types'
import { ComplaintSheet, type ComplaintTarget } from '@/components/complaint-sheet'

/** Labels for codes the server sends without text. */
export const SYSTEM_TEXT: Record<string, string> = {
	PAY_AT_BOX: 'Оплата в боксе при осмотре',
	REQUEST_CLOSED: 'Запрос закрыт: купили в этом боксе',
}
export const QUICK_TEXT: Record<string, string> = {
	ARRIVED: 'Я на месте',
	RESERVED: 'Отложил для вас',
	ROUTE: 'Как пройти',
	SOLD: 'Продано',
	ROUTE_TO_BOX: 'Как пройти к боксу',
	CLOSE_REQUEST: 'Купил — закрыть запрос',
}
/** Quick replies styled green in the mockups. */
const POSITIVE = new Set(['CLOSE_REQUEST', 'SOLD'])

interface Props {
	chatId: number
	mySide: ChatSide
	/** Header row — differs between the buyer [08] and the seller [13]. `complain` opens «Пожаловаться» on the chat. */
	header: (typing: boolean, complain: () => void) => ReactNode
	/** Pinned request card under the header [08]. */
	pinned?: ReactNode
	/** ACTION quick replies (ROUTE_TO_BOX, CLOSE_REQUEST) — handled by the screen. */
	onAction: (reply: QuickReply) => void
}

/** Shared chat body of 08 and 13: history, quick replies, composer, typing, read receipts. */
export function ChatConversation({ chatId, mySide, header, pinned, onAction }: Props) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const chat = useChat(chatId)
	const history = useChatMessages(chatId)
	const quick = useQuickReplies(chatId)
	const sender = useSendMessage(chatId, mySide)
	const media = useSendMedia(chatId, mySide)
	const voice = useVoiceRecorder((recorded) => media.mutate({ type: 'VOICE', ...recorded, clientId: newIdempotencyKey() }))
	const markRead = useMarkRead(chatId)
	const connected = useRealtime((s) => s.state === 'connected')
	const { typing, publishTyping } = useChatChannel(chatId, mySide)
	const [text, setText] = useState('')
	const [complaint, setComplaint] = useState<ComplaintTarget | null>(null)
	const lastRead = useRef(0)

	const messages = flattenPages(history.data)

	// One chat per pair: a REPLY says which request / service request it answers [08, 37].
	const aboutLabel = (message: ChatMessage) => {
		if (message.type !== 'REPLY') return null
		const payload = (message.payload ?? {}) as { requestId?: number; serviceRequestId?: number }
		const pinned = chat.data
		if (payload.serviceRequestId) {
			return payload.serviceRequestId === pinned?.serviceRequest?.id ? `по заявке «${pinned.serviceRequest.text}»` : 'по другой заявке'
		}
		if (payload.requestId) {
			return payload.requestId === pinned?.request?.id ? `по запросу «${pinned.request.text}»` : 'по другому запросу'
		}
		return null
	}
	const otherRead = chat.data?.otherReadMessageId ?? 0
	const canWrite = chat.data?.canWrite ?? true
	const lastMine = messages.find((m) => m.side === mySide)

	// Mark the newest message of the other side as read while the chat is open.
	const newestTheirs = messages.find((m) => m.side !== mySide && m.id > 0)
	useEffect(() => {
		if (!newestTheirs || newestTheirs.id <= lastRead.current) return
		lastRead.current = newestTheirs.id
		markRead.mutate(newestTheirs.id)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mark once per new message
	}, [newestTheirs?.id])

	const send = () => {
		const value = text.trim()
		if (!value) return
		sender.send({ text: value })
		setText('')
	}

	/** Photo or video from the gallery. */
	const attach = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 1 })
		if (result.canceled) return
		const asset = result.assets[0]
		const video = asset.type === 'video'
		media.mutate({
			type: video ? 'VIDEO' : 'PHOTO',
			uri: asset.uri,
			mimeType: asset.mimeType ?? (video ? 'video/mp4' : 'image/jpeg'),
			durationSeconds: video && asset.duration ? asset.duration / 1000 : undefined,
			clientId: newIdempotencyKey(),
		})
	}

	const pressQuick = (reply: QuickReply) => {
		if (reply.kind === 'ACTION') return onAction(reply)
		if (reply.code) sender.send({ quickReply: reply.code })
		else sender.send({ text: reply.text })
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}
		>
			{header(typing, () => setComplaint({ type: 'CHAT', targetId: chatId }))}
			{pinned}

			{voice.error || media.error ? (
				<Text style={{ marginHorizontal: 16, marginTop: 8, fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>
					{voice.error ?? media.error?.message}
				</Text>
			) : null}

			<QueryErrorBanner
				error={history.error ?? chat.error}
				onRetry={() => history.refetch()}
				offlineText="Нет сети. Сообщения отправятся, когда появится"
				style={{ marginHorizontal: 16, marginTop: 12 }}
			/>

			<FlatList
				inverted
				data={messages}
				keyExtractor={(m) => String(m.clientId ?? m.id)}
				contentContainerStyle={{ padding: 16, gap: 10 }}
				onEndReached={() => history.hasNextPage && !history.isFetchingNextPage && history.fetchNextPage()}
				renderItem={({ item }) => (
					<Message
						message={item}
						mine={item.side === mySide}
						shopSide={mySide === 'SHOP'}
						status={
							item.id === lastMine?.id
								? item.id < 0
									? sender.isError || media.isError
										? 'failed'
										: 'sending'
									: item.id <= otherRead || item.read
										? 'read'
										: 'sent'
								: undefined
						}
						onRetry={() => sender.retry(item)}
						about={aboutLabel(item)}
						// Long press on the other side's message — report it.
						onComplain={
							item.side !== mySide && item.id > 0 && item.code !== 'HIDDEN_BY_ADMIN'
								? () => setComplaint({ type: 'CHAT_MESSAGE', targetId: item.id })
								: undefined
						}
					/>
				)}
			/>

			{quick.data?.length && canWrite ? (
				<View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{quick.data.map((reply) => {
						const positive = reply.code ? POSITIVE.has(reply.code) : false
						return (
							<Pressable
								key={`${reply.code ?? reply.templateId}-${reply.text}`}
								onPress={() => pressQuick(reply)}
								style={{
									height: 44,
									paddingHorizontal: 12,
									borderRadius: 20,
									borderWidth: 2,
									borderColor: positive ? c.success : c.border,
									backgroundColor: positive ? c.successTint : c.card,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(positive ? 700 : 600), color: positive ? c.success : c.ink }}>
									{reply.text}
								</Text>
							</Pressable>
						)
					})}
				</View>
			) : null}

			<View
				style={{
					paddingTop: 10,
					paddingHorizontal: 12,
					paddingBottom: Math.max(insets.bottom, 28),
					backgroundColor: c.card,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 8,
				}}
			>
				{canWrite && !voice.recording ? (
					<Pressable
						onPress={attach}
						style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}
					>
						<CameraV23Icon size={22} color={c.ink} />
					</Pressable>
				) : null}
				{voice.recording ? (
					<RecordingBar seconds={voice.seconds} onCancel={voice.cancel} />
				) : (
					<TextInput
						value={text}
						editable={canWrite}
						onChangeText={(value) => {
							setText(value)
							if (connected) publishTyping()
						}}
						onSubmitEditing={send}
						placeholder={canWrite ? 'Сообщение' : chat.data?.blockedByOther ? 'Собеседник ограничил чат' : 'Чат недоступен'}
						placeholderTextColor="#8C8888"
						maxLength={2000}
						style={{
							flex: 1,
							height: 44,
							borderRadius: 22,
							backgroundColor: c.surface,
							paddingHorizontal: 16,
							fontSize: 17.5,
							fontFamily: fontFamily(400),
							color: c.ink,
						}}
					/>
				)}
				{text.trim() || voice.recording ? (
					<Pressable
						onPress={voice.recording ? voice.send : send}
						disabled={!canWrite}
						style={{
							width: 48,
							height: 48,
							borderRadius: 24,
							backgroundColor: c.brand,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<SendIcon size={20} color="#FFFFFF" />
					</Pressable>
				) : (
					// Empty field — the mic: tap to record a voice message (up to 60 s), send with the arrow.
					<Pressable
						onPress={voice.start}
						disabled={!canWrite}
						style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
					>
						<MicV23Icon size={22} color="#FFFFFF" />
					</Pressable>
				)}
			</View>
			<ComplaintSheet target={complaint} onClose={() => setComplaint(null)} />
		</KeyboardAvoidingView>
	)
}

function Message({
	message,
	mine,
	status,
	onRetry,
	onComplain,
	about,
	shopSide,
}: {
	message: ChatMessage
	/** The seller reads the chat — a DELIVERY card opens «Заказ с доставкой», for the buyer «Где посылка». */
	shopSide?: boolean
	/** «по запросу «Стойки передние»» over a REPLY. */
	about?: string | null
	mine: boolean
	status?: 'sending' | 'sent' | 'read' | 'failed'
	onRetry: () => void
	onComplain?: () => void
}) {
	const c = useColors()

	// Hidden by the administration: no text and no attachments come — say so instead.
	if (message.code === 'HIDDEN_BY_ADMIN') {
		return (
			<View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', borderRadius: 16, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed', paddingVertical: 10, paddingHorizontal: 14 }}>
				<Text style={{ fontSize: 15.5, fontStyle: 'italic', fontFamily: fontFamily(400), color: c.muted }}>Сообщение скрыто администрацией</Text>
			</View>
		)
	}

	// «Заказ с доставкой KDB-… · в Ош · 350 с» — opens the order.
	if (message.type === 'DELIVERY') {
		const orderId = (message.payload as { deliveryOrderId?: unknown } | null)?.deliveryOrderId
		return (
			<Pressable
				onPress={() =>
					typeof orderId === 'number' &&
					router.push({ pathname: '/delivery-order', params: { id: String(orderId), ...(shopSide ? { as: 'shop' } : {}) } })
				}
				style={{ alignSelf: 'center', width: 280, borderRadius: 16, backgroundColor: '#FCEBB0', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
			>
				<TruckTile size={40} />
				<View style={{ flex: 1, gap: 2 }}>
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(800), color: c.ink }}>Заказ с доставкой</Text>
					{message.text ? <Text style={{ fontSize: 14.5, lineHeight: 18.5, fontFamily: fontFamily(500), color: c.inkSecondary }}>{message.text}</Text> : null}
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{shopSide ? 'Открыть заказ ›' : 'Где посылка ›'}</Text>
				</View>
			</Pressable>
		)
	}

	if (message.side === 'SYSTEM' || message.type === 'SYSTEM') {
		return (
			<View style={{ alignSelf: 'center', borderRadius: 10, backgroundColor: c.brandTint, paddingVertical: 6, paddingHorizontal: 12 }}>
				<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.brandStrong }}>
					{message.text ?? SYSTEM_TEXT[message.code ?? ''] ?? ''}
				</Text>
			</View>
		)
	}

	const payload = (message.payload ?? {}) as Record<string, unknown>
	const price = typeof payload.price === 'number' ? formatPrice(payload.price) : null
	// A master's «Могу помочь» [37]: `{offerId, priceFrom, availableAt}`.
	const offerPrice = typeof payload.priceFrom === 'number' ? `от ${formatPrice(payload.priceFrom)}` : null
	const offerAt = typeof payload.availableAt === 'string' ? formatWhenAt(payload.availableAt) : null
	const partReply = message.type === 'REPLY' && typeof payload.requestId === 'number'
	const body = partReply
		? replyText(payload, message.text)
		: (message.text ?? (message.code ? QUICK_TEXT[message.code] : null) ?? '')

	// Voice notes — mine and the other side's — the pill player from the v23 mockup [07], as in requests.
	if (message.type === 'VOICE' && message.mediaUrl) {
		return (
			<View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', width: 230, gap: 3, opacity: status === 'sending' ? 0.7 : 1 }}>
				<VoicePlayer
					voice={{ url: message.mediaUrl, durationSec: message.durationSeconds ?? 0, waveform: message.waveform ?? [] }}
					background={c.card}
				/>
				<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: raw.fillInk, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
					{formatClock(message.createdAt)}
				</Text>
			</View>
		)
	}

	return (
		<Pressable onLongPress={onComplain} disabled={!onComplain} delayLongPress={450} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', gap: 3 }}>
			<View
				style={{
					maxWidth: 260,
					borderRadius: 18,
					borderBottomLeftRadius: mine ? 18 : 6,
					borderBottomRightRadius: mine ? 6 : 18,
					backgroundColor: mine ? c.brand : c.card,
					paddingVertical: message.type === 'PHOTO' || message.type === 'VIDEO' ? 4 : 10,
					paddingHorizontal: message.type === 'PHOTO' || message.type === 'VIDEO' ? 4 : 14,
					gap: 6,
					opacity: status === 'sending' ? 0.7 : 1,
				}}
			>
				{about ? (
					<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(600), color: mine ? 'rgba(255,255,255,0.8)' : c.muted }}>
						{about}
					</Text>
				) : null}
				{message.type === 'PHOTO' && message.mediaUrl ? (
					<Image source={{ uri: resolveUrl(message.mediaUrl) }} style={{ width: 220, height: 220, borderRadius: 12 }} />
				) : null}
				{message.type === 'VIDEO' && message.mediaUrl ? <VideoBubble mediaUrl={message.mediaUrl} /> : null}
				{body && message.code === 'RESERVED' ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
						<TickIcon size={18} color={c.success} strokeWidth={2.8} />
						<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: mine ? '#FFFFFF' : c.ink }}>{body}</Text>
					</View>
				) : body ? (
					<Text style={{ fontSize: 17.5, lineHeight: 24, fontFamily: fontFamily(400), color: mine ? '#FFFFFF' : c.ink }}>{body}</Text>
				) : null}
				{price && !partReply && (message.type === 'REPLY' || message.type === 'PART') ? (
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(800), color: mine ? '#FFFFFF' : c.ink }}>{price}</Text>
				) : null}
				{message.type === 'REPLY' && (offerPrice || offerAt) ? (
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(800), color: mine ? '#FFFFFF' : c.ink }}>
						{offerPrice}
						{offerPrice && offerAt ? ' · ' : ''}
						{offerAt ? <Text style={{ fontFamily: fontFamily(700), color: mine ? '#FFFFFF' : c.success }}>{offerAt}</Text> : null}
					</Text>
				) : null}
			</View>
			<Text
				onPress={status === 'failed' ? onRetry : undefined}
				style={{
					alignSelf: mine ? 'flex-end' : 'flex-start',
					fontSize: 12,
					fontFamily: fontFamily(status === 'failed' ? 700 : 400),
					color: status === 'failed' ? c.danger : raw.fillInk,
				}}
			>
				{status === 'failed'
					? 'Не отправлено · повторить'
					: status === 'sending'
						? 'отправляется…'
						: `${formatClock(message.createdAt)}${status === 'read' ? ' · прочитано' : status === 'sent' ? ' · доставлено' : ''}`}
			</Text>
		</Pressable>
	)
}

const CONDITION_WORD: Record<string, string> = { NEW: 'новые', USED: 'б/у', ON_ORDER: 'под заказ' }

/** «Есть KYB оригинал, новые. Пара — 3 200 сом» from the REPLY card payload [07]; the seller's own text follows. */
function replyText(payload: Record<string, unknown>, text: string | null | undefined) {
	const condition = typeof payload.condition === 'string' ? payload.condition : null
	const original = typeof payload.original === 'boolean' ? payload.original : null
	const manufacturer = typeof payload.manufacturer === 'string' ? payload.manufacturer : null
	const tags = Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === 'string') : []
	const head = ['Есть', manufacturer, original === true ? 'оригинал' : original === false ? 'копия' : null].filter(Boolean).join(' ')
	let line = condition ? `${head}, ${CONDITION_WORD[condition] ?? ''}` : head
	if (tags.length) line += `. ${tags.join(', ')}`
	if (typeof payload.price === 'number') line += ` — ${formatPrice(payload.price)}`
	return text ? `${line}\n${text}` : line
}
