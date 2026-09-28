import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Badge, Card, Screen, SectionLabel } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { buyerRequests, currentUser } from '@/mocks'

export default function BuyerHomeScreen() {
	const c = useColors()
	const [answered, waiting, closed] = buyerRequests

	return (
		<Screen>
			<View style={{ paddingTop: 12, gap: 14, flex: 1 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>
						Салам, {currentUser.name}
					</Text>
					<Pressable
						onPress={() => router.push('/catalog')}
						style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}
					>
						<SearchIcon size={20} color={c.brandStrong} strokeWidth={2.4} />
					</Pressable>
				</View>

				<Pressable
					onPress={() => router.push('/search-part')}
					style={{
						height: 210,
						marginTop: 6,
						borderRadius: 28,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
						gap: 16,
						overflow: 'hidden',
						shadowColor: c.brand,
						shadowOpacity: 0.35,
						shadowOffset: { width: 0, height: 12 },
						shadowRadius: 14,
						elevation: 12,
					}}
				>
					<View
						style={{
							position: 'absolute',
							width: 260,
							height: 260,
							borderRadius: 130,
							backgroundColor: 'rgba(255,255,255,0.07)',
							right: -80,
							top: -90,
						}}
					/>
					<View
						style={{
							position: 'absolute',
							width: 180,
							height: 180,
							borderRadius: 90,
							backgroundColor: 'rgba(255,255,255,0.06)',
							left: -60,
							bottom: -80,
						}}
					/>
					<View
						style={{
							width: 104,
							height: 104,
							borderRadius: 52,
							backgroundColor: 'rgba(255,255,255,0.18)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<View
							style={{
								width: 84,
								height: 84,
								borderRadius: 42,
								backgroundColor: '#FFFFFF',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<SearchIcon size={40} color={c.brand} strokeWidth={2.6} />
						</View>
					</View>
					<Text style={{ fontSize: 26, fontFamily: fontFamily(800), letterSpacing: -0.26, color: '#FFFFFF' }}>
						Найти запчасть
					</Text>
				</Pressable>

				<SectionLabel style={{ paddingTop: 6 }}>Мои запросы</SectionLabel>

				<Card style={{ gap: 8 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{answered.title}</Text>
						<Badge label={answered.statusLabel} tone="success" />
					</View>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{answered.meta}</Text>
				</Card>

				<Card style={{ gap: 8 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{waiting.title}</Text>
						<Badge label={waiting.statusLabel} tone="neutral" />
					</View>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{waiting.meta}</Text>
				</Card>

				<View
					style={{
						borderRadius: 16,
						borderWidth: 2,
						borderColor: c.hairline,
						paddingVertical: 14,
						paddingHorizontal: 16,
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{closed.title}</Text>
					<Badge label={closed.statusLabel} tone="muted" />
				</View>
			</View>
		</Screen>
	)
}
