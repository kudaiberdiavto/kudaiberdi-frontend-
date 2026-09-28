import { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MarketMapLive, type MarketMapLiveHandle } from '@/components/market-map-live'
import { ChevronLeftIcon, LocateIcon } from '@/components/icons'
import { schemaToGeo } from '@/lib/geo'
import { fontFamily, raw, useColors } from '@/theme'
import { routeToBox } from '@/mocks'

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
	const mapRef = useRef<MarketMapLiveHandle>(null)

	/** Открываем сразу приближенным к боксу, а не на весь рынок. */
	useEffect(() => {
		mapRef.current?.focusOn(schemaToGeo(routeToBox.target.x, routeToBox.target.y), 18.5)
	}, [])

	return (
		<View style={{ flex: 1, backgroundColor: raw.mapSurface }}>
			<MarketMapLive ref={mapRef} route={routeToBox.points} />

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
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{routeToBox.title}</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{routeToBox.subtitle}</Text>
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

				<View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
					<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{routeToBox.time}</Text>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{routeToBox.distance}</Text>
				</View>

				{routeToBox.steps.map((step, i) => (
					<View key={step} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
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
							{step}
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
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{routeToBox.actions.message}</Text>
					</Pressable>
					<Pressable
						style={{
							flex: 1.4,
							height: 52,
							borderRadius: 12,
							backgroundColor: c.brand,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{routeToBox.actions.arrived}</Text>
					</Pressable>
				</View>
			</View>
		</View>
	)
}
