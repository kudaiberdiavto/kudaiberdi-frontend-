import { useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { router } from 'expo-router'
import { usePullRefresh } from '@/lib/use-pull-refresh'
import { Avatar, Chip, EmptyState, QueryErrorBanner, Screen, SkeletonRepeat, SkeletonRow } from '@/components/ui'
import { ChatIcon, SearchIcon } from '@/components/icons'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatChatTime } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { type ChatListAs, useChats } from '@/api/chats'
import type { ChatListItem } from '@/api/types'
import { QUICK_TEXT, SYSTEM_TEXT } from './chat-conversation'
import { t } from '@/i18n'

/**
 * 16 «Чаты» — the buyer's chats or the box's chats. Rows are kept live by the CHAT event.
 * `also` — one more side in the same list, newest first (a master: clients and the sellers they asked for parts).
 */
export function ChatList({ as, also }: { as: ChatListAs; also?: ChatListAs }) {
	const c = useColors()
	const chats = useChats(as)
	const extra = useChats(also ?? as, Boolean(also))
	const pull = usePullRefresh(() => [chats.refetch(), also && extra.refetch()])
	const items = also
		? [...flattenPages(chats.data), ...flattenPages(extra.data)].sort((x, y) =>
				(y.lastMessage?.at ?? y.updatedAt).localeCompare(x.lastMessage?.at ?? x.updatedAt)
			)
		: flattenPages(chats.data)
	// The server has no search — filter what's loaded; scrolling keeps loading more pages.
	const [q, setQ] = useState('')
	const [onlyUnread, setOnlyUnread] = useState(false)
	const needle = q.trim().toLowerCase()
	const unreadCount = items.filter((chat) => chat.unread > 0).length
	const shown = items.filter(
		(chat) =>
			(!onlyUnread || chat.unread > 0) &&
			(!needle || [chat.title, chat.subtitle, chat.lastMessage?.text].some((text) => text?.toLowerCase().includes(needle)))
	)
	const filtered = Boolean(needle) || onlyUnread

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 12 }}>
				<Text style={{ fontSize: fs.h1, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>{t('Чаты')}</Text>
			</View>

			{items.length ? (
				<View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}>
					<View style={{ height: 44, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }}>
						<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
						<TextInput
							value={q}
							onChangeText={setQ}
							placeholder={t('Поиск по чатам')}
							placeholderTextColor={c.fillInk}
							returnKeyType="search"
							clearButtonMode="while-editing"
							style={{ flex: 1, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
						/>
					</View>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Chip label={t('Все')} selected={!onlyUnread} onPress={() => setOnlyUnread(false)} height={36} radius={18} />
						<Chip
							label={unreadCount ? t('Непрочитанные · {0}', unreadCount) : t('Непрочитанные')}
							selected={onlyUnread}
							onPress={() => setOnlyUnread(true)}
							height={36}
							radius={18}
						/>
					</View>
				</View>
			) : null}

			<QueryErrorBanner
				error={chats.error ?? (also ? extra.error : null)}
				onRetry={() => (chats.refetch(), also && extra.refetch())}
				offlineText={t('Нет сети. Покажем чаты, когда появится')}
				style={{ marginHorizontal: 16, marginBottom: 12 }}
			/>

			<FlatList
				data={shown}
				keyboardShouldPersistTaps="handled"
				keyExtractor={(item) => String(item.id)}
				onEndReached={() => {
					if (chats.hasNextPage && !chats.isFetchingNextPage) chats.fetchNextPage()
					if (also && extra.hasNextPage && !extra.isFetchingNextPage) extra.fetchNextPage()
				}}
				onRefresh={pull.onRefresh}
				refreshing={pull.refreshing}
				renderItem={({ item }) => <ChatRow chat={item} />}
				contentContainerStyle={{ flexGrow: 1 }}
				ListEmptyComponent={
					filtered && items.length ? (
						<EmptyState title={onlyUnread && !needle ? t('Всё прочитано') : t('Ничего не нашли')} icon={onlyUnread && !needle ? ChatIcon : SearchIcon} />
					) : chats.isSuccess ? (
						<EmptyState title={t('Чатов нет')} icon={ChatIcon} />
					) : chats.isLoading ? (
						<SkeletonRepeat count={8}>
							<SkeletonRow lines={3} />
						</SkeletonRepeat>
					) : undefined
				}
			/>
		</Screen>
	)
}

function ChatRow({ chat }: { chat: ChatListItem }) {
	const c = useColors()
	const last = chat.lastMessage
	const lastText = last ? (last.text ?? QUICK_TEXT[last.code ?? ''] ?? SYSTEM_TEXT[last.code ?? ''] ?? (last.type === 'PHOTO' ? t('Фото') : last.type === 'VOICE' ? t('Голосовое') : '')) : ''

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
				<Avatar letter={chat.title.charAt(0).toUpperCase()} color={chat.unread ? c.brandStrong : c.inkSecondary} />
			)}

			<View style={{ flex: 1, gap: 3 }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
					<Text numberOfLines={1} style={{ flex: 1, fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>
						{chat.title}
					</Text>
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>
						{formatChatTime(last?.at ?? chat.updatedAt)}
					</Text>
				</View>

				{chat.subtitle ? (
					<Text numberOfLines={1} style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>
						{chat.subtitle}
					</Text>
				) : null}

				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
					<Text
						numberOfLines={1}
						style={{ flex: 1, fontSize: fs.base, fontFamily: fontFamily(400), color: chat.unread ? c.ink : c.muted }}
					>
						{last?.fromMe ? t('Вы: {0}', lastText) : lastText}
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
							<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: fixed.white }}>{chat.unread}</Text>
						</View>
					) : null}
				</View>
			</View>
		</Pressable>
	)
}
