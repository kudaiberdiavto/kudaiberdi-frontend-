import { FlatList, Image, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, QueryErrorBanner, Screen } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatChatTime } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { type ChatListAs, useChats } from '@/api/chats'
import type { ChatListItem } from '@/api/types'
import { QUICK_TEXT, SYSTEM_TEXT } from './chat-conversation'

/** 16 «Чаты» — the buyer's chats or the box's chats. Rows are kept live by the CHAT event. */
export function ChatList({ as }: { as: ChatListAs }) {
	const c = useColors()
	const chats = useChats(as)
	const items = flattenPages(chats.data)

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 12 }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Чаты</Text>
			</View>

			<QueryErrorBanner
				error={chats.error}
				onRetry={() => chats.refetch()}
				offlineText="Нет сети. Покажем чаты, когда появится"
				style={{ marginHorizontal: 16, marginBottom: 12 }}
			/>

			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				onEndReached={() => chats.hasNextPage && !chats.isFetchingNextPage && chats.fetchNextPage()}
				onRefresh={() => chats.refetch()}
				refreshing={false}
				renderItem={({ item, index }) => <ChatRow chat={item} highlight={index === 0} />}
				ListEmptyComponent={
					chats.isSuccess ? (
						<Text style={{ paddingHorizontal: 16, fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.muted }}>
							{as === 'BUYER'
								? 'Здесь появятся переписки с продавцами — после ответа «Есть» или «Написать» в карточке.'
								: as === 'MASTER'
									? 'Здесь появятся переписки с клиентами — после вашего отклика «Могу помочь».'
									: 'Здесь появятся переписки с покупателями — после вашего ответа «Есть».'}
						</Text>
					) : null
				}
			/>
		</Screen>
	)
}

function ChatRow({ chat, highlight }: { chat: ChatListItem; highlight: boolean }) {
	const c = useColors()
	const last = chat.lastMessage
	const lastText = last ? (last.text ?? QUICK_TEXT[last.code ?? ''] ?? SYSTEM_TEXT[last.code ?? ''] ?? (last.type === 'PHOTO' ? 'Фото' : last.type === 'VOICE' ? 'Голосовое' : '')) : ''

	return (
		<Pressable
			onPress={() =>
				router.push({ pathname: chat.mySide === 'SHOP' ? '/seller-chat' : '/chat', params: { chatId: String(chat.id) } })
			}
			style={{
				paddingVertical: 14,
				paddingHorizontal: 16,
				flexDirection: 'row',
				gap: 12,
				alignItems: 'center',
				borderBottomWidth: 2,
				borderBottomColor: c.hairline,
				// Closed request or a blocked chat — shown faded, as in the mockup.
				opacity: chat.requestClosed || chat.blocked ? 0.55 : 1,
			}}
		>
			{chat.avatarUrl ? (
				<Image source={{ uri: resolveUrl(chat.avatarUrl) }} style={{ width: 52, height: 52, borderRadius: 14 }} />
			) : (
				<Avatar letter={chat.title.charAt(0).toUpperCase()} color={highlight ? c.brandStrong : c.inkSecondary} />
			)}

			<View style={{ flex: 1, gap: 3 }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
					<Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
						{chat.title}
					</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						{formatChatTime(last?.at ?? chat.updatedAt)}
					</Text>
				</View>

				{chat.subtitle ? (
					<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						{chat.subtitle}
					</Text>
				) : null}

				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
					<Text
						numberOfLines={1}
						style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: chat.unread ? c.ink : c.muted }}
					>
						{last?.fromMe ? `Вы: ${lastText}` : lastText}
					</Text>
					{chat.unread ? (
						<View
							style={{
								minWidth: 22,
								height: 22,
								paddingHorizontal: 6,
								borderRadius: 11,
								backgroundColor: c.brand,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{chat.unread}</Text>
						</View>
					) : null}
				</View>
			</View>
		</Pressable>
	)
}
