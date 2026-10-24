import { useEffect, useRef } from 'react'
import { Linking, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { MarketMapLive, type MarketMapLiveHandle } from '@/components/market-map-live'
import { QueryErrorBanner } from '@/components/ui'
import { LinearGradient } from 'expo-linear-gradient'
import { BigButton, BubbleIcon, CallIcon, TopBar } from '@/components/buyer-v23'
import { schemaToGeo } from '@/lib/geo'
import { fontFamily, raw, useColors } from '@/theme'
import { formatPlace } from '@/lib/format'
import { useRoute } from '@/api/market'

export default function RouteScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ containerId: string; shopName?: string; chatId?: string; phone?: string }>()
	const chatId = Number(params.chatId) || 0
	const route = useRoute(Number(params.containerId) || 0)
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

	const minutes = data ? Math.max(1, data.minutes) : null

	return (
		<View style={{ flex: 1, backgroundColor: raw.mapSurface }}>
			<MarketMapLive ref={mapRef} route={data?.polyline} highlightedRowIds={data ? [data.target.rowId] : undefined} />

			<LinearGradient
				colors={[c.surface, c.surface, 'rgba(243,245,248,0)']}
				locations={[0, 0.6, 1]}
				pointerEvents="none"
				style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 60 }}
			/>
			<View style={{ position: 'absolute', left: 0, right: 0, top: insets.top }}>
				<TopBar title="Как пройти" />
			</View>

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
					paddingBottom: Math.max(insets.bottom, 28),
					gap: 12,
					shadowColor: '#201F1D',
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: -8 },
					shadowRadius: 12,
					elevation: 8,
				}}
			>
				<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

				<QueryErrorBanner error={route.error} onRetry={() => route.refetch()} offlineText="Нет сети. Маршрут построим, когда появится" />

				{data ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
						<PlaceBox label="РЯД" value={data.target.rowCode} />
						<PlaceBox label="КОНТ." value={String(data.target.number)} />
						<View style={{ flex: 1, gap: 2 }}>
							<Text numberOfLines={1} style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>
								{params.shopName ?? formatPlace(data.target)}
							</Text>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
								≈ {minutes} мин пешком{data.fromSource === 'ENTRANCE' ? ' от входа' : ''}
							</Text>
						</View>
					</View>
				) : null}

				{(data?.steps ?? []).map((step, i) => (
					<View key={step.n} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
						<View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(800), color: c.brandStrong }}>{i + 1}</Text>
						</View>
						<Text style={{ flex: 1, fontSize: 15, lineHeight: 19.5, fontFamily: fontFamily(500), color: c.ink }}>{step.text}</Text>
					</View>
				))}

				<View style={{ flexDirection: 'row', gap: 10 }}>
					<BigButton
						label="Позвонить"
						tone="green"
						height={52}
						icon={<CallIcon size={20} color="#FFFFFF" strokeWidth={2.4} />}
						disabled={!params.phone}
						onPress={() => params.phone && Linking.openURL(`tel:${params.phone}`)}
						style={{ flex: 1 }}
					/>
					<BigButton
						label="Написать"
						tone="grey"
						height={52}
						icon={<BubbleIcon size={20} color={c.ink} strokeWidth={2.4} />}
						disabled={!chatId}
						onPress={() => router.push({ pathname: '/chat', params: { chatId: String(chatId) } })}
						style={{ flex: 1 }}
					/>
				</View>
			</View>
		</View>
	)
}

/** «РЯД 14» / «КОНТ. 12» — blue boxes in the sheet [06]. */
function PlaceBox({ label, value }: { label: string; value: string }) {
	const c = useColors()
	return (
		<View style={{ borderRadius: 14, backgroundColor: c.brand, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' }}>
			<Text style={{ fontSize: 11, fontFamily: fontFamily(700), letterSpacing: 0.88, color: 'rgba(255,255,255,0.85)' }}>{label}</Text>
			<Text style={{ fontSize: 24, lineHeight: 26, fontFamily: fontFamily(800), color: '#FFFFFF' }}>{value}</Text>
		</View>
	)
}
