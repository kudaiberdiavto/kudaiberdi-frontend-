import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Card, QueryErrorBanner, Screen, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { formatAgo } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useIncomingRequests, useReplyToRequest } from '@/api/incoming'
import { useMyShop, useSetShopOpen } from '@/api/shop'
import type { IncomingRequest } from '@/api/types'
import { AccountStatusBanner } from '@/components/account-status-banner'

export default function SellerRequestsScreen() {
	const c = useColors()
	const shop = useMyShop()
	const setOpen = useSetShopOpen()
	const fresh = useIncomingRequests('NEW')
	const answered = useIncomingRequests('ANSWERED')

	const open = shop.data?.isOpen ?? true
	const newItems = flattenPages(fresh.data)
	const answeredItems = flattenPages(answered.data)

	return (
		<Screen padding={0}>
			<View
				style={{
					paddingTop: 4,
					paddingHorizontal: 16,
					paddingBottom: 14,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Запросы</Text>
				<View
					style={{
						height: 40,
						paddingLeft: 12,
						paddingRight: 6,
						borderRadius: 20,
						backgroundColor: open ? c.successTint : c.hairline,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: open ? c.success : c.muted }}>{open ? 'Бокс открыт' : 'Бокс закрыт'}</Text>
					<Toggle value={open} onChange={(value) => shop.data && setOpen.mutate(value)} />
				</View>
			</View>

			<FlatList
				data={newItems}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => fresh.hasNextPage && !fresh.isFetchingNextPage && fresh.fetchNextPage()}
				onRefresh={() => {
					fresh.refetch()
					answered.refetch()
				}}
				refreshing={false}
				ListHeaderComponent={
					<View style={{ gap: 12 }}>
						<AccountStatusBanner
							status={shop.data?.status}
							reason={shop.data?.blockReason}
							kind="shop"
							action={{ label: 'Выбрать другой контейнер', onPress: () => router.push('/box-select') }}
						/>
						<QueryErrorBanner error={fresh.error ?? setOpen.error} onRetry={() => fresh.refetch()} offlineText="Нет сети. Покажем запросы, когда появится" />
					</View>
				}
				renderItem={({ item }) => <NewRequestCard request={item} />}
				ListFooterComponent={
					<View style={{ gap: 12 }}>
						{fresh.isSuccess && newItems.length === 0 ? (
							<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted, paddingVertical: 8 }}>
								{open ? 'Новых запросов нет. Пришлём пуш, как только спросят.' : 'Бокс закрыт — запросы не приходят'}
							</Text>
						) : null}
						{answeredItems.map((item) => (
							<View
								key={item.id}
								style={{
									borderRadius: 16,
									borderWidth: 2,
									borderColor: c.hairline,
									paddingVertical: 14,
									paddingHorizontal: 16,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 12,
								}}
							>
								<Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
									{item.text} · {item.car.modelLabel}
								</Text>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.success }}>{item.soldHere ? 'Купили у вас' : 'Вы ответили «есть»'}</Text>
							</View>
						))}
					</View>
				}
			/>
		</Screen>
	)
}

function NewRequestCard({ request }: { request: IncomingRequest }) {
	const c = useColors()
	const reply = useReplyToRequest(request.id)
	const meta = [request.car.label, request.photos.length ? 'есть фото' : null].filter(Boolean).join(' · ')

	return (
		<Card style={{ gap: 10 }}>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 19, fontFamily: fontFamily(700), color: c.ink }}>
					{request.text}
				</Text>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{formatAgo(request.notifiedAt, { short: true })}</Text>
			</View>
			<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.inkSecondary }}>{meta}</Text>
			{reply.error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{reply.error.message}</Text> : null}
			<View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
				<Pressable
					onPress={() => router.push({ pathname: '/seller-answer', params: { id: String(request.id) } })}
					style={{
						flex: 2,
						height: 52,
						borderRadius: 12,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Есть</Text>
				</Pressable>
				<Pressable
					disabled={reply.isPending}
					onPress={() => reply.mutate({ answer: 'NOT_HAVE' })}
					style={{
						flex: 1,
						height: 52,
						borderRadius: 12,
						borderWidth: 2,
						borderColor: c.border,
						alignItems: 'center',
						justifyContent: 'center',
						opacity: reply.isPending ? 0.4 : 1,
					}}
				>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.inkSecondary }}>Нет</Text>
				</Pressable>
			</View>
		</Card>
	)
}
