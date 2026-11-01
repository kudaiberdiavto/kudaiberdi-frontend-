import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChatConversation, presenceLabel } from '@/components/chat-conversation'
import { ChevronLeftIcon, FlagIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { useChat } from '@/api/chats'
import { t } from '@/i18n'

/** 13 — seller's (or master's) chat with a buyer. */
export default function SellerChatScreen() {
	const c = useColors()
	const chatId = Number(useLocalSearchParams<{ chatId: string }>().chatId) || 0
	const chat = useChat(chatId).data
	const request = chat?.request ?? chat?.serviceRequest
	const presence = presenceLabel(chat?.online, chat?.lastSeenAt)

	return (
		<ChatConversation
			chatId={chatId}
			mySide="SHOP"
			header={(typing, complain) => (
				<View
					style={{
						paddingTop: 4,
						paddingHorizontal: 16,
						paddingBottom: 12,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 12,
						borderBottomWidth: 2,
						borderBottomColor: c.hairline,
					}}
				>
					<Pressable onPress={() => router.back()}>
						<ChevronLeftIcon size={24} color={c.ink} />
					</Pressable>
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: c.ink }}>
							{chat ? (chat.buyer.name ?? t('Покупатель')) : ' '}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: 14.5, fontFamily: fontFamily(400), color: typing ? c.success : c.muted }}>
							{typing ? (
								t('печатает…')
							) : (
								<>
									{presence ? <Text style={{ color: chat?.online ? c.success : c.muted }}>{presence}</Text> : null}
									{presence && request ? ' · ' : null}
									{request ? `${request.text} · ${request.carLabel}` : presence ? null : ' '}
								</>
							)}
						</Text>
					</View>
					<Pressable onPress={complain} hitSlop={10} accessibilityLabel={t('Пожаловаться')}>
						<FlagIcon size={20} color={c.muted} />
					</Pressable>
				</View>
			)}
			// Seller quick replies are messages (RESERVED, ROUTE, SOLD) — no client actions.
			onAction={() => {}}
		/>
	)
}
