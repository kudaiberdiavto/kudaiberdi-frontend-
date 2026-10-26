import { FlatList, Image, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { BrandLogo, QueryErrorBanner, Screen } from '@/components/ui'
import { VoicePlayer } from '@/components/voice'
import { BoltIcon, MicIcon, OpenPill, TickIcon } from '@/components/seller-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatAgo, formatNumber, formatRemaining } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useIncomingRequests, useReplyToRequest } from '@/api/incoming'
import { useMyShop, useSetShopOpen } from '@/api/shop'
import { useDeliveryOrders } from '@/api/delivery'
import { TruckTile, toRegion } from '@/components/video-v23'
import { priceDigits } from '@/components/buyer-v23'
import type { DeliveryOrder, IncomingRequest } from '@/api/types'
import { AccountStatusBanner } from '@/components/account-status-banner'

/** 13 «Запросы» — new requests on top with «Ответить голосом», answered ones below. */
export default function SellerRequestsScreen() {
	const c = useColors()
	const shop = useMyShop()
	const setOpen = useSetShopOpen()
	const fresh = useIncomingRequests('NEW')
	const answered = useIncomingRequests('ANSWERED')
	// Orders with delivery still to pack or hand to the courier — on top.
	const delivery = useDeliveryOrders('SHOP')
	const orders = (delivery.data ?? []).filter((order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED')

	const open = shop.data?.isOpen ?? true
	const items = [...flattenPages(fresh.data), ...flattenPages(answered.data)]

	return (
		<Screen padding={0}>
			<View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Text style={{ flex: 1, fontSize: 26, fontFamily: fontFamily(700), color: c.ink }}>Запросы</Text>
				<OpenPill open={open} onChange={(value) => shop.data && setOpen.mutate(value)} />
			</View>

			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					if (fresh.hasNextPage && !fresh.isFetchingNextPage) fresh.fetchNextPage()
					else if (!fresh.hasNextPage && answered.hasNextPage && !answered.isFetchingNextPage) answered.fetchNextPage()
				}}
				onRefresh={() => {
					fresh.refetch()
					answered.refetch()
					delivery.refetch()
				}}
				refreshing={false}
				ListHeaderComponent={
					<View style={{ gap: 10 }}>
						<AccountStatusBanner
							status={shop.data?.status}
							reason={shop.data?.blockReason}
							kind="shop"
							action={{ label: 'Выбрать другой контейнер', onPress: () => router.push('/box-select') }}
						/>
						<QueryErrorBanner
							error={fresh.error ?? setOpen.error}
							onRetry={() => fresh.refetch()}
							offlineText="Нет сети. Покажем запросы, когда появится"
						/>
						{orders.map((order) => (
							<DeliveryCard key={order.id} order={order} />
						))}
						<View
							style={{
								borderRadius: 14,
								backgroundColor: c.brandTint,
								paddingVertical: 10,
								paddingHorizontal: 14,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
							}}
						>
							<BoltIcon size={18} color={c.brandStrong} />
							<Text style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(400), color: '#1D2B53' }}>
								Кто отвечает быстрее — тот выше в списке у покупателя
							</Text>
						</View>
						{fresh.isSuccess && answered.isSuccess && items.length === 0 ? (
							<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted, paddingVertical: 8 }}>
								{open ? 'Новых запросов нет. Пришлём пуш, как только спросят.' : 'Бокс закрыт — запросы не приходят'}
							</Text>
						) : null}
					</View>
				}
				renderItem={({ item }) => <RequestCard request={item} />}
			/>
		</Screen>
	)
}

/** «Заказ с доставкой · в Ош» → «Упакуйте и ждите курьера». */
function DeliveryCard({ order }: { order: DeliveryOrder }) {
	const c = useColors()
	const status =
		order.status === 'NEW'
			? 'Упакуйте посылку'
			: order.status === 'PICKED_UP'
				? 'Отдали курьеру'
				: `Курьер приедет ${order.pickupToday ? 'сегодня' : 'завтра'}`
	return (
		<Pressable
			onPress={() => router.push({ pathname: '/delivery-order', params: { id: String(order.id), as: 'shop' } })}
			style={{ borderRadius: 18, backgroundColor: '#FCEBB0', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
		>
			<TruckTile size={44} />
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={{ fontSize: 12, fontFamily: fontFamily(700), letterSpacing: 1, color: '#7A5A00' }}>
					{`${order.status === 'NEW' ? 'Новый заказ' : 'Заказ с доставкой'} · в ${toRegion(order.districtName ?? order.regionName)}`.toUpperCase()}
				</Text>
				<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(800), color: c.ink }}>
					{order.part.title}
				</Text>
				<Text numberOfLines={1} style={{ fontSize: 13.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>
					{priceDigits(order.part.price)} сом · {status}
				</Text>
			</View>
		</Pressable>
	)
}

function RequestCard({ request }: { request: IncomingRequest }) {
	const c = useColors()
	const reply = useReplyToRequest(request.id)
	const mine = request.myReply
	const photo = request.photos[0]
	const meta = mine
		? formatAgo(request.notifiedAt)
		: `${formatAgo(request.notifiedAt)} · ${formatRemaining(request.expiresAt)}`

	return (
		<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<BrandLogo brand={request.car.brand} size={32} />
				<View style={{ flex: 1, gap: 1 }}>
					<Text style={{ fontSize: 15, lineHeight: 19.5, fontFamily: fontFamily(700), color: c.ink }}>{request.car.label}</Text>
					<Text style={{ fontSize: 13, lineHeight: 16.9, fontFamily: fontFamily(400), color: c.muted }}>{meta}</Text>
				</View>
			</View>

			<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
				{photo ? (
					<Image
						source={{ uri: resolveUrl(photo.thumbUrl) }}
						style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: c.surface }}
					/>
				) : null}
				<View style={{ flex: 1, gap: 6 }}>
					<Text style={{ fontSize: 16, lineHeight: 20.8, fontFamily: fontFamily(600), color: c.ink }}>{request.text}</Text>
					{request.voice ? <VoicePlayer voice={request.voice} /> : null}
				</View>
			</View>

			{mine ? (
				<View
					style={{
						height: 44,
						borderRadius: 12,
						backgroundColor: '#E7F6EC',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 6,
					}}
				>
					<TickIcon size={18} color={c.success} strokeWidth={2.8} />
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.success }}>
						{request.soldHere
							? 'Купили у вас'
							: mine.answer === 'HAVE'
								? `Вы ответили: есть${mine.price ? ` · ${formatNumber(mine.price)} с` : ''}`
								: 'Вы ответили: нет'}
					</Text>
				</View>
			) : (
				<>
					<Pressable
						onPress={() => router.push({ pathname: '/seller-answer', params: { id: String(request.id), voice: '1' } })}
						style={{
							height: 56,
							borderRadius: 14,
							backgroundColor: c.brand,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 10,
							shadowColor: c.brand,
							shadowOpacity: 0.25,
							shadowOffset: { width: 0, height: 6 },
							shadowRadius: 14,
							elevation: 4,
						}}
					>
						<View
							style={{
								width: 34,
								height: 34,
								borderRadius: 17,
								backgroundColor: 'rgba(255,255,255,0.2)',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<MicIcon size={20} color="#FFFFFF" />
						</View>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Ответить голосом</Text>
					</Pressable>
					<Text style={{ fontSize: 13, lineHeight: 16.9, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center' }}>
						Например: «Есть, оригинал, пара — три двести»
					</Text>
					{reply.error ? (
						<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{reply.error.message}</Text>
					) : null}
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable
							disabled={reply.isPending}
							onPress={() => reply.mutate({ answer: 'NOT_HAVE' })}
							style={{
								flex: 1,
								height: 44,
								borderRadius: 14,
								backgroundColor: '#EFEDEC',
								alignItems: 'center',
								justifyContent: 'center',
								opacity: reply.isPending ? 0.4 : 1,
							}}
						>
							<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>Нет</Text>
						</Pressable>
						<Pressable
							onPress={() => router.push({ pathname: '/seller-answer', params: { id: String(request.id) } })}
							style={{
								flex: 1,
								height: 44,
								borderRadius: 14,
								backgroundColor: '#E7F6EC',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8,
							}}
						>
							<TickIcon size={20} color={c.success} />
							<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.success }}>Есть</Text>
						</Pressable>
					</View>
				</>
			)}
		</View>
	)
}
