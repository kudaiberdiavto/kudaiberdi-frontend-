import { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { MarketMapLive, type MarketMapLiveHandle } from '@/components/market-map-live'
import { QueryErrorBanner } from '@/components/ui'
import { ChevronLeftIcon, LocateIcon } from '@/components/icons'
import { schemaToGeo } from '@/lib/geo'
import { fontFamily, raw, useColors } from '@/theme'
import { formatDuration, formatPlace, formatSide } from '@/lib/format'
import { useRoute } from '@/api/market'
import { useSendMessage } from '@/api/chats'

const cardShadow = {
	shadowColor: '#201F1D',
	shadowOpacity: 0.12,
	shadowOffset: { width: 0, height: 2 },
	shadowRadius: 5,
	elevation: 3,
}

export default function RouteScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ containerId: string; shopName?: string; chatId?: string }>()
	const chatId = Number(params.chatId) || 0
	const route = useRoute(Number(params.containerId) || 0)
	const sender = useSendMessage(chatId, 'BUYER')
	const mapRef = useRef<MarketMapLiveHandle>(null)
	const data = route.data
	const polyline = data?.polyline

	/** Открываем на середине маршрута, чтобы путь от входа до бокса был виден целиком. */
	useEffect(() => {
		if (!polyline?.length) return
		const xs = polyline.map(([x]) => x)
		const ys = polyline.map(([, y]) => y)
		const mid = schemaToGeo((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2)
		mapRef.current?.focusOn(mid, 16.6)
	}, [polyline])

	const subtitle = data
		? [params.shopName, `${formatSide(data.target.side)} сторона`].filter(Boolean).join(' · ')
		: ' '

	return (
		<View style={{ flex: 1, backgroundColor: raw.mapSurface }}>
			<MarketMapLive ref={mapRef} route={data?.polyline} highlightedRowIds={data ? [data.target.rowId] : undefined} />

			<View
				style={[
					{
						position: 'absolute',
						left: 16,
						right: 16,
						top: insets.top + 10,
						borderRadius: 14,
						backgroundColor: c.card,
						paddingVertical: 10,
						paddingHorizontal: 14,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 12,
					},
					cardShadow,
				]}
			>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<View style={{ flex: 1, gap: 2 }}>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{data ? formatPlace(data.target) : ' '}</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{subtitle}</Text>
				</View>
			</View>

			<Pressable
				onPress={() => mapRef.current?.focusOnMe(18)}
				style={[
					{
						position: 'absolute',
						right: 16,
						bottom: 278,
						width: 48,
						height: 48,
						borderRadius: 14,
						backgroundColor: c.card,
						alignItems: 'center',
						justifyContent: 'center',
					},
					cardShadow,
				]}
			>
				<LocateIcon size={24} color={c.brand} />
			</Pressable>

			<View
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 10,
					paddingHorizontal: 16,
					paddingBottom: 28 + insets.bottom,
					gap: 12,
					shadowColor: '#201F1D',
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: -4 },
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

				<QueryErrorBanner error={route.error} onRetry={() => route.refetch()} offlineText="Нет сети. Маршрут построим, когда появится" />

				<View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
					<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>
						{data ? formatDuration(Math.max(1, data.minutes)) : ' '}
					</Text>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
						{data ? `· ${data.distanceM} м пешком${data.fromSource === 'ENTRANCE' ? ' от входа' : ''}` : ''}
					</Text>
				</View>

				{(data?.steps ?? []).map((step, i) => (
					<View key={step.n} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
						<View
							style={{
								width: 28,
								height: 28,
								borderRadius: 14,
								backgroundColor: i === 0 ? c.brand : raw.fill,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: i === 0 ? '#FFFFFF' : c.ink }}>
								{i + 1}
							</Text>
						</View>
						<Text
							style={{
								flex: 1,
								fontSize: 15,
								lineHeight: 19.5,
								fontFamily: fontFamily(i === 0 ? 700 : 500),
								color: c.ink,
							}}
						>
							{step.text}
						</Text>
					</View>
				))}

				<View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
					<Pressable
						onPress={() => router.back()}
						style={{
							flex: 1,
							height: 52,
							borderRadius: 12,
							backgroundColor: raw.fill,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{chatId ? 'Написать' : 'Назад'}</Text>
					</Pressable>
					<Pressable
						// «Я на месте» — the ARRIVED quick reply to the seller (when opened from the chat).
						disabled={!chatId || sender.isPending}
						onPress={() => sender.send({ quickReply: 'ARRIVED' })}
						style={{
							opacity: chatId ? 1 : 0.4,
							flex: 1.4,
							height: 52,
							borderRadius: 12,
							backgroundColor: c.brand,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
							{sender.isSuccess ? 'Продавец знает ✓' : 'Я на месте'}
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	)
}
