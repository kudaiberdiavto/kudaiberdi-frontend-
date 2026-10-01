import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { QueryErrorBanner, Screen } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { formatAgo } from '@/lib/format'
import { flattenPages } from '@/api/pagination'
import { useIncomingRequests } from '@/api/incoming'

/** «Смотреть» from the stats [17]: requests the box missed (time ran out or closed, no answer). */
export default function SellerMissedScreen() {
	const c = useColors()
	const missed = useIncomingRequests('UNANSWERED')
	const items = flattenPages(missed.data)

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ fontSize: 22, fontFamily: fontFamily(700), letterSpacing: -0.22, color: c.ink }}>Без ответа</Text>
			</View>

			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
				onEndReached={() => missed.hasNextPage && !missed.isFetchingNextPage && missed.fetchNextPage()}
				ListHeaderComponent={<QueryErrorBanner error={missed.error} onRetry={() => missed.refetch()} />}
				ListEmptyComponent={
					missed.isSuccess ? (
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Пропущенных запросов нет</Text>
					) : null
				}
				renderItem={({ item }) => (
					<View
						style={{
							borderRadius: 16,
							borderWidth: 2,
							borderColor: c.hairline,
							paddingVertical: 14,
							paddingHorizontal: 16,
							gap: 4,
						}}
					>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
							<Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
								{item.text}
							</Text>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{formatAgo(item.notifiedAt)}</Text>
						</View>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{item.car.label} · {item.status === 'CLOSED' ? 'закрыт' : 'время вышло'}
						</Text>
					</View>
				)}
			/>
		</Screen>
	)
}
