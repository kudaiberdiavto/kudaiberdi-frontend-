import { Image, Linking, Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChatConversation, presenceLabel } from '@/components/chat-conversation'
import { BackIcon, BoxOutlineIcon, CallIcon, WrenchIcon } from '@/components/buyer-v23'
import { resolveUrl } from '@/lib/api'
import { fontFamily, useColors } from '@/theme'
import { useChat } from '@/api/chats'
import { openShopRoute } from '@/lib/shop-place'

/** 07 — buyer's chat with a shop, or with a master (then `shop = null`, `master` and `serviceRequest`); call in one tap. */
export default function BuyerChatScreen() {
	const c = useColors()
	const params = useLocalSearchParams<{ chatId: string; draft?: string }>()
	const chatId = Number(params.chatId) || 0
	const chat = useChat(chatId).data
	const shop = chat?.shop
	const master = chat?.master
	const request = chat?.request ?? chat?.serviceRequest

	const phone = shop?.phone ?? master?.phone ?? null
	const avatar = resolveUrl(shop?.avatarUrl ?? master?.avatarUrl ?? null)
	const name = shop?.name ?? master?.name ?? ' '
	const presence = presenceLabel(chat?.online, chat?.lastSeenAt)
	const place = shop
		? shop.location
			? `Кудайберген · ${shop.location.rowLabel} · конт. ${shop.location.number}`
			: (shop.address ?? '')
		: master
			? master.mobile
				? 'выездной мастер'
				: master.address
			: ''

	return (
		<ChatConversation
			chatId={chatId}
			draft={params.draft}
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
					{/* Avatar and name — the shop's profile (or the master's card). */}
					<Pressable
						onPress={() =>
							shop
								? router.push({ pathname: '/seller-profile', params: { id: String(shop.id) } })
								: master
									? router.push({ pathname: '/master-card', params: { id: String(master.id) } })
									: undefined
						}
						style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
					>
						{avatar ? (
							<Image source={{ uri: avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface }} />
						) : (
							<View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
								<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{name.slice(0, 1).toUpperCase()}</Text>
							</View>
						)}
						<View style={{ flex: 1, gap: 1 }}>
							<Text numberOfLines={1} style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>
								{name}
							</Text>
							<Text numberOfLines={1} style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: typing ? c.success : c.brandStrong }}>
								{typing ? (
								'печатает…'
							) : (
								<>
									{presence ? <Text style={{ color: chat?.online ? c.success : c.muted }}>{presence}</Text> : null}
									{presence && place ? <Text style={{ color: c.muted }}> · </Text> : null}
									{place}
								</>
							)}
						</Text>
						</View>
					</Pressable>
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
							<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{chat?.serviceRequest ? 'Ваша заявка' : 'Ваш запрос'}</Text>
							<Text numberOfLines={1} style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.ink }}>
								{request.text} · {request.carLabel}
							</Text>
						</View>
					</View>
				) : null
			}
			onAction={(reply) => {
				if (reply.code === 'ROUTE_TO_BOX' && shop) openShopRoute(shop, { chatId })
				// «Купил» — on the request screen: «Нашли запчасть?» [08]
				if (reply.code === 'CLOSE_REQUEST' && chat?.request) {
					router.push({ pathname: '/request', params: { id: String(chat.request.id) } })
				}
			}}
		/>
	)
}
