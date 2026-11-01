import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { BrandLogo, EmptyState, QueryErrorBanner, Screen } from '@/components/ui'
import { RequestsIcon } from '@/components/icons'
import { VoicePlayer } from '@/components/voice'
import { MediaGallery, MediaStrip, photosAsMedia } from '@/components/media-strip'
import { isPlaceholderText } from '@/components/request-text'
import { MicIcon, TickIcon } from '@/components/seller-v23'
import { fontFamily, useColors } from '@/theme'
import { formatAgo, formatNumber, formatRemaining } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useIncomingRequests, useReplyToRequest } from '@/api/incoming'
import { useMyShop } from '@/api/shop'
import { useDeliveryOrders } from '@/api/delivery'
import { TruckTile, toRegion } from '@/components/video-v23'
import { priceDigits } from '@/components/buyer-v23'
import type { DeliveryOrder, IncomingRequest } from '@/api/types'
import { AccountStatusBanner } from '@/components/account-status-banner'
import { t } from '@/i18n'

/** 13 «Запросы» — new requests on top with «Ответить голосом», answered ones below. */
export default function SellerRequestsScreen() {
	const c = useColors()
	const shop = useMyShop()
	const fresh = useIncomingRequests('NEW')
	const answered = useIncomingRequests('ANSWERED')
	// Orders with delivery still to pack or hand to the courier — on top.
	const delivery = useDeliveryOrders('SHOP')
	const orders = (delivery.data ?? []).filter((order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED')

	const items = [...flattenPages(fresh.data), ...flattenPages(answered.data)]

	return (
		<Screen padding={0}>
			<View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Text style={{ flex: 1, fontSize: 26, fontFamily: fontFamily(700), color: c.ink }}>{t('Запросы')}</Text>
			</View>

			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ flexGrow: 1, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				ListEmptyComponent={
					fresh.isSuccess && answered.isSuccess && !orders.length ? (
						<EmptyState title={t('Новых запросов нет')} icon={RequestsIcon} />
					) : null
				}
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
							action={{ label: t('Выбрать другой контейнер'), onPress: () => router.push('/box-select') }}
						/>
						<QueryErrorBanner
							error={fresh.error}
							onRetry={() => fresh.refetch()}
							offlineText={t('Нет сети. Покажем запросы, когда появится')}
						/>
						{orders.map((order) => (
							<DeliveryCard key={order.id} order={order} />
						))}
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
			? t('Упакуйте посылку')
			: order.status === 'PICKED_UP'
				? t('Отдали курьеру')
				: t('Курьер приедет {0}', order.pickupToday ? t('сегодня') : t('завтра'))
	return (
		<Pressable
			onPress={() => router.push({ pathname: '/delivery-order', params: { id: String(order.id), as: 'shop' } })}
			style={{ borderRadius: 18, backgroundColor: '#FCEBB0', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
		>
			<TruckTile size={44} />
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1, color: '#7A5A00' }}>
					{t('{0} · в {1}', order.status === 'NEW' ? t('Новый заказ') : t('Заказ с доставкой'), toRegion(order.districtName ?? order.regionName)).toUpperCase()}
				</Text>
				<Text numberOfLines={1} style={{ fontSize: 17.5, fontFamily: fontFamily(800), color: c.ink }}>
					{order.part.title}
				</Text>
				<Text numberOfLines={1} style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.inkSecondary }}>
					{t('{0} сом · {1}', priceDigits(order.part.price), status)}
				</Text>
			</View>
		</Pressable>
	)
}

/** A request card; `full` — on its own screen: photos large, no tap-through. */
export function RequestCard({ request, full }: { request: IncomingRequest; full?: boolean }) {
	const c = useColors()
	const reply = useReplyToRequest(request.id)
	const mine = request.myReply
	const meta = mine
		? formatAgo(request.notifiedAt)
		: `${formatAgo(request.notifiedAt)} · ${formatRemaining(request.expiresAt)}`

	return (
		<Pressable
			disabled={full}
			onPress={() => router.push({ pathname: '/incoming-request', params: { id: String(request.id) } })}
			style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10 }}
		>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<BrandLogo brand={request.car.brand} size={36} />
				<View style={{ flex: 1, gap: 1 }}>
					<Text numberOfLines={1} style={{ fontSize: 16.5, lineHeight: 21.5, fontFamily: fontFamily(700), color: c.ink }}>
						{request.car.label}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: 14.5, lineHeight: 18.5, fontFamily: fontFamily(400), color: c.muted }}>
						<Text style={{ fontFamily: fontFamily(600), color: c.inkSecondary }}>{request.buyerName?.trim() || t('Покупатель')}</Text> · {meta}
					</Text>
				</View>
			</View>

			<View style={{ gap: 8 }}>
				{isPlaceholderText(request.text) ? null : (
					<Text style={{ fontSize: 17.5, lineHeight: 23, fontFamily: fontFamily(600), color: c.ink }}>{request.text}</Text>
				)}
				{request.voice ? <VoicePlayer voice={request.voice} /> : null}
				{full ? <MediaGallery media={photosAsMedia(request.photos)} /> : <MediaStrip media={photosAsMedia(request.photos)} />}
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
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.success }}>
						{request.soldHere
							? t('Купили у вас')
							: mine.answer === 'HAVE'
								? t('Вы ответили: есть') + (mine.price ? t(' · {0} с', formatNumber(mine.price)) : '')
								: t('Вы ответили: нет')}
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
						<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{t('Ответить голосом')}</Text>
					</Pressable>
					{reply.error ? (
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{reply.error.message}</Text>
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
							<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>{t('Нет')}</Text>
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
							<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.success }}>{t('Есть')}</Text>
						</Pressable>
					</View>
				</>
			)}
		</Pressable>
	)
}
