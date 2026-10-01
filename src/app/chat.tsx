import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChatConversation } from '@/components/chat-conversation'
import { ChevronLeftIcon, FlagIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { formatPlace } from '@/lib/format'
import { useChat } from '@/api/chats'

/** 08 — buyer's chat with a shop, or with a master [37] (then `shop = null`, `master` and `serviceRequest`). */
export default function BuyerChatScreen() {
	const c = useColors()
	const chatId = Number(useLocalSearchParams<{ chatId: string }>().chatId) || 0
	const chat = useChat(chatId).data
	const shop = chat?.shop
	const master = chat?.master
	const request = chat?.request ?? chat?.serviceRequest

	return (
		<ChatConversation
			chatId={chatId}
			mySide="BUYER"
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
					<Pressable
						style={{ flex: 1, gap: 2 }}
						onPress={() => shop && router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })}
					>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{shop?.name ?? master?.name ?? ' '}</Text>
						<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
							{shop ? `${formatPlace(shop.location)} · ` : master ? `${master.mobile ? 'выезд' : master.address} · ` : ' '}
							<Text style={{ color: typing || chat?.online ? c.success : c.muted }}>
								{typing ? 'печатает…' : chat?.online ? 'в сети' : (shop?.open.openNow ?? master?.isOpenNow) ? 'открыт' : 'закрыт'}
							</Text>
						</Text>
					</Pressable>
					<Pressable onPress={complain} hitSlop={10} accessibilityLabel="Пожаловаться">
						<FlagIcon size={20} color={c.muted} />
					</Pressable>
				</View>
			)}
			pinned={
				request ? (
					<View
						style={{
							marginTop: 12,
							marginHorizontal: 16,
							borderRadius: 12,
							backgroundColor: c.card,
							paddingVertical: 10,
							paddingHorizontal: 14,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
						}}
					>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{chat?.serviceRequest ? 'Заявка' : 'Запрос'}</Text>
						<Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(700), color: c.ink }}>
							{request.text} · {request.carLabel}
						</Text>
					</View>
				) : null
			}
			onAction={(reply) => {
				if (reply.code === 'ROUTE_TO_BOX' && shop) {
					router.push({
						pathname: '/route',
						params: { containerId: String(shop.location.containerId), shopName: shop.name, chatId: String(chatId) },
					})
				}
				if (reply.code === 'CLOSE_REQUEST' && chat?.request && shop) {
					router.push({ pathname: '/closed', params: { id: String(chat.request.id), shopId: String(shop.id), shopName: shop.name } })
				}
			}}
		/>
	)
}
