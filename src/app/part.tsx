import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { PhotoPlaceholder } from '@/components/ui'
import { ChatIcon, CheckIcon, ChevronLeftIcon, MapPinIcon, ShareIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { partCard } from '@/mocks'

export default function PartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<View>
				<PhotoPlaceholder width={undefined} height={320} radius={0} style={{ width: '100%' }} />

				<View
					style={{
						position: 'absolute',
						left: 16,
						right: 16,
						top: insets.top + 9,
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}
				>
					<Pressable
						onPress={() => router.back()}
						style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
					>
						<ChevronLeftIcon size={24} color={c.ink} />
					</Pressable>
					<Pressable
						style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
					>
						<ShareIcon size={20} color={c.ink} />
					</Pressable>
				</View>

				<View style={{ position: 'absolute', right: 16, bottom: 16, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(32,31,29,0.6)', alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{partCard.photosCount}</Text>
				</View>
			</View>

			<View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
				<Text style={{ fontSize: 28, fontFamily: fontFamily(800), letterSpacing: -0.28, color: c.ink }}>{partCard.price}</Text>
				<Text style={{ fontSize: 17, fontFamily: fontFamily(400), color: c.inkSecondary }}>{partCard.title}</Text>

				<View
					style={{
						borderRadius: 12,
						backgroundColor: c.successTint,
						paddingVertical: 10,
						paddingHorizontal: 12,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.border }} />
					<Text style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(400), color: '#14532D' }}>
						<Text style={{ fontFamily: fontFamily(700) }}>Подходит</Text> {partCard.fitsCar}
					</Text>
					<CheckIcon size={18} color={c.success} strokeWidth={3} />
				</View>

				<View style={{ flexDirection: 'row', gap: 8 }}>
					<View style={{ flex: 1, borderRadius: 12, backgroundColor: c.card, padding: 10, gap: 3 }}>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>{partCard.condition.label}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>{partCard.condition.value}</Text>
					</View>
					<View style={{ flex: 1, borderRadius: 12, backgroundColor: c.card, padding: 10, gap: 3 }}>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>{partCard.stock.label}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>{partCard.stock.value}</Text>
					</View>
				</View>

				<Pressable
					onPress={() => router.push('/seller-profile')}
					style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 12 }}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: raw.fill }} />
						<View style={{ flex: 1, gap: 2 }}>
							<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{partCard.seller.name}</Text>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
								{partCard.seller.meta}
								<Text style={{ fontFamily: fontFamily(700), color: c.success }}>{partCard.seller.openLabel}</Text>
							</Text>
						</View>
						<Text style={{ fontSize: 20, color: c.muted }}>›</Text>
					</View>
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<PhotoPlaceholder width={107} height={56} radius={10} style={{ flex: 1 }} />
						<PhotoPlaceholder width={107} height={56} radius={10} style={{ flex: 1 }} />
						<PhotoPlaceholder width={107} height={56} radius={10} style={{ flex: 1 }} />
					</View>
				</Pressable>
			</View>

			<View
				style={{
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: insets.bottom + 12,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					backgroundColor: c.card,
					flexDirection: 'row',
					gap: 8,
				}}
			>
				<Pressable
					onPress={() => router.push('/route')}
					style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: raw.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
				>
					<MapPinIcon size={20} color={c.ink} />
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{partCard.actions.route}</Text>
				</Pressable>
				<Pressable
					onPress={() => router.push('/chat')}
					style={{ flex: 1.3, height: 54, borderRadius: 14, backgroundColor: c.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
				>
					<ChatIcon size={20} color="#FFFFFF" />
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{partCard.actions.message}</Text>
				</Pressable>
			</View>
		</View>
	)
}
