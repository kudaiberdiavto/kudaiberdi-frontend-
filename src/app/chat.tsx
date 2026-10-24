import { Image, Linking, Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChatConversation } from '@/components/chat-conversation'
import { BackIcon, BoxOutlineIcon, CallIcon, WrenchIcon } from '@/components/buyer-v23'
import { resolveUrl } from '@/lib/api'
import { fontFamily, useColors } from '@/theme'
import { useChat } from '@/api/chats'

/** 07 — buyer's chat with a shop, or with a master (then `shop = null`, `master` and `serviceRequest`); call in one tap. */
export default function BuyerChatScreen() {
	const c = useColors()
	const chatId = Number(useLocalSearchParams<{ chatId: string }>().chatId) || 0
	const chat = useChat(chatId).data
	const shop = chat?.shop
	const master = chat?.master
	const request = chat?.request ?? chat?.serviceRequest

	const phone = shop?.phone ?? master?.phone ?? null
	const avatar = resolveUrl(shop?.avatarUrl ?? master?.avatarUrl ?? null)
	const name = shop?.name ?? master?.name ?? ' '

	return (
		<ChatConversation
			chatId={chatId}
			mySide="BUYER"
			header={(typing) => (
				<View
					style={{
						height: 64,
						paddingHorizontal: 16,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
						backgroundColor: c.card,
						borderBottomWidth: 1,
						borderBottomColor: c.hairline,
					}}
				>
					<Pressable onPress={() => router.back()} hitSlop={10}>
						<BackIcon color={c.ink} />
					</Pressable>
					{avatar ? (
						<Image source={{ uri: avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface }} />
					) : (
						<View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>{name.slice(0, 1).toUpperCase()}</Text>
						</View>
					)}
					<View style={{ flex: 1, gap: 1 }}>
						<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
							{name}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(500), color: typing ? c.success : c.brandStrong }}>
							{typing
								? 'печатает…'
								: shop
									? `${shop.location.rowLabel} · контейнер ${shop.location.number}`
									: master
										? master.mobile
											? 'выездной мастер'
											: master.address
										: ' '}
						</Text>
					</View>
					{phone ? (
						<Pressable
							onPress={() => Linking.openURL(`tel:${phone}`)}
							accessibilityLabel="Позвонить"
							style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}
						>
							<CallIcon size={22} color="#FFFFFF" />
						</Pressable>
					) : null}
				</View>
			)}
			pinned={
				request ? (
					<View
						style={{
							marginTop: 14,
							alignSelf: 'center',
							borderRadius: 14,
							backgroundColor: c.card,
							borderWidth: 1.5,
							borderColor: c.border,
							padding: 8,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
							maxWidth: '90%',
						}}
					>
						<View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							{chat?.serviceRequest ? <WrenchIcon size={20} color={c.brandStrong} /> : <BoxOutlineIcon size={20} color={c.brandStrong} />}
						</View>
						<View style={{ flexShrink: 1, gap: 1 }}>
							<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: c.muted }}>{chat?.serviceRequest ? 'Ваша заявка' : 'Ваш запрос'}</Text>
							<Text numberOfLines={1} style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>
								{request.text} · {request.carLabel}
							</Text>
						</View>
					</View>
				) : null
			}
			onAction={(reply) => {
				if (reply.code === 'ROUTE_TO_BOX' && shop) {
					router.push({
						pathname: '/route',
						params: {
							containerId: String(shop.location.containerId),
							shopName: shop.name,
							chatId: String(chatId),
							phone: shop.phone ?? undefined,
						},
					})
				}
				// «Купил» — on the request screen: «Нашли запчасть?» [08]
				if (reply.code === 'CLOSE_REQUEST' && chat?.request) {
					router.push({ pathname: '/request', params: { id: String(chat.request.id) } })
				}
			}}
		/>
	)
}
