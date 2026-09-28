import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MarketMapLive, type MarketMapLiveHandle } from '@/components/market-map-live'
import { LocateIcon, SearchIcon } from '@/components/icons'
import { blockCenterGeo } from '@/lib/market-geojson'
import { fontFamily, raw, useColors } from '@/theme'
import { marketScreen } from '@/mocks'

const cardShadow = {
	shadowColor: '#201F1D',
	shadowOpacity: 0.12,
	shadowOffset: { width: 0, height: 2 },
	shadowRadius: 5,
	elevation: 3,
}

export default function BuyerMarketScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [brand, setBrand] = useState(0)
	const [mode, setMode] = useState(0)
	const mapRef = useRef<MarketMapLiveHandle>(null)

	/** При смене марки наводимся на ближайший ряд, где она есть. */
	useEffect(() => {
		const center = blockCenterGeo(marketScreen.brandRows[0])
		if (center) mapRef.current?.focusOn(center, 17.5)
	}, [brand])

	return (
		<View style={{ flex: 1, backgroundColor: raw.mapSurface }}>
			<MarketMapLive ref={mapRef} highlighted={marketScreen.brandRows} />

			<View style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 10 }}>
				<View
					style={[
						{
							height: 48,
							borderRadius: 14,
							backgroundColor: c.card,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 10,
							paddingHorizontal: 14,
						},
						cardShadow,
					]}
				>
					<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
					<Text style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.muted }}>
						{marketScreen.searchPlaceholder}
					</Text>
				</View>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 66 }}
				contentContainerStyle={{ gap: 8, paddingLeft: 16, paddingRight: 16 }}
			>
				{marketScreen.filters.map((label) => (
					<View
						key={label}
						style={[
							{
								height: 36,
								borderRadius: 18,
								paddingHorizontal: 14,
								backgroundColor: c.card,
								alignItems: 'center',
								justifyContent: 'center',
							},
							cardShadow,
						]}
					>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>{label}</Text>
					</View>
				))}
			</ScrollView>

			<View
				style={[
					{
						position: 'absolute',
						left: 16,
						bottom: 196,
						paddingVertical: 8,
						paddingHorizontal: 10,
						borderRadius: 12,
						backgroundColor: 'rgba(255,255,255,0.94)',
						gap: 6,
					},
					cardShadow,
				]}
			>
				{marketScreen.legend.map((item) => (
					<View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<View
							style={{
								width: 16,
								height: 8,
								borderRadius: item.radius,
								backgroundColor: item.background,
								borderWidth: item.width,
								borderColor: item.border,
							}}
						/>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: c.inkSecondary }}>{item.label}</Text>
					</View>
				))}
			</View>

			<View
				style={[
					{
						position: 'absolute',
						right: 16,
						bottom: 252,
						width: 48,
						borderRadius: 14,
						backgroundColor: c.card,
						alignItems: 'center',
					},
					cardShadow,
				]}
			>
				<Pressable onPress={() => mapRef.current?.zoomBy(1)} style={{ height: 46, justifyContent: 'center' }}>
					<Text style={{ fontSize: 24, fontFamily: fontFamily(500), color: c.ink }}>+</Text>
				</Pressable>
				<View style={{ width: 28, height: 1, backgroundColor: c.hairline }} />
				<Pressable onPress={() => mapRef.current?.zoomBy(-1)} style={{ height: 46, justifyContent: 'center' }}>
					<Text style={{ fontSize: 24, fontFamily: fontFamily(500), color: c.ink }}>−</Text>
				</Pressable>
			</View>

			<Pressable
				onPress={() => mapRef.current?.focusOnMe()}
				style={[
					{
						position: 'absolute',
						right: 16,
						bottom: 196,
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
					paddingBottom: 16,
					gap: 12,
					shadowColor: '#201F1D',
					shadowOpacity: 0.1,
					shadowOffset: { width: 0, height: -4 },
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

				<View style={{ height: 40, borderRadius: 12, backgroundColor: c.surface, padding: 3, flexDirection: 'row' }}>
					{marketScreen.modes.map((label, i) => {
						const active = mode === i
						return (
							<Pressable
								key={label}
								onPress={() => setMode(i)}
								style={[
									{
										flex: 1,
										borderRadius: 9,
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: active ? c.card : 'transparent',
									},
									active && {
										shadowColor: '#201F1D',
										shadowOpacity: 0.12,
										shadowOffset: { width: 0, height: 1 },
										shadowRadius: 1.5,
										elevation: 1,
									},
								]}
							>
								<Text
									style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? c.ink : c.muted }}
								>
									{label}
								</Text>
							</Pressable>
						)
					})}
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 8, paddingRight: 16 }}
					style={{ marginRight: -16 }}
				>
					{marketScreen.brands.map((label, i) => {
						const active = brand === i
						return (
							<Pressable
								key={label}
								onPress={() => setBrand(i)}
								style={{
									height: 36,
									paddingHorizontal: 14,
									borderRadius: 18,
									backgroundColor: active ? c.brand : c.surface,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text
									style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}
								>
									{active ? `✓ ${label}` : label}
								</Text>
							</Pressable>
						)
					})}
				</ScrollView>

				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<View style={{ gap: 2 }}>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
							{marketScreen.summaryTitle}
						</Text>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
							{marketScreen.summaryMeta}
						</Text>
					</View>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>
						{marketScreen.listLink}
					</Text>
				</View>
			</View>
		</View>
	)
}
