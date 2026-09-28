import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Badge, PhotoPlaceholder, Screen } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CameraIcon, PlusIcon, SearchIcon } from '@/components/icons'
import { brandBySlug } from '@/data/brands'
import { fontFamily, useColors } from '@/theme'
import { myPartsScreen, sellerParts } from '@/mocks'

export default function SellerProductsScreen() {
	const c = useColors()
	const [filter, setFilter] = useState('all')

	const items = sellerParts.filter((p) => (filter === 'all' ? true : filter === 'in' ? p.stock === 'in' : p.stock === 'out'))

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				<Text style={{ flex: 1, fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>
					{myPartsScreen.title}
				</Text>
				<Pressable
					onPress={() => router.push('/camera')}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}
				>
					<CameraIcon size={20} color={c.brandStrong} strokeWidth={2.2} />
				</Pressable>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10 }} showsVerticalScrollIndicator={false}>
				<View
					style={{
						height: 44,
						borderRadius: 12,
						backgroundColor: c.card,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
						paddingHorizontal: 12,
					}}
				>
					<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: '#7D7979' }}>{myPartsScreen.searchPlaceholder}</Text>
				</View>

				<View style={{ flexDirection: 'row', gap: 8 }}>
					{myPartsScreen.filters.map((item) => {
						const active = filter === item.value
						return (
							<Pressable
								key={item.value}
								onPress={() => setFilter(item.value)}
								style={{
									height: 36,
									paddingHorizontal: 14,
									borderRadius: 18,
									backgroundColor: active ? c.brand : c.card,
									borderWidth: active ? 0 : 1.5,
									borderColor: c.border,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}>{item.label}</Text>
							</Pressable>
						)
					})}
				</View>

				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
					{myPartsScreen.viewsLabel} <Text style={{ fontFamily: fontFamily(700), color: c.ink }}>{myPartsScreen.viewsCount}</Text>{' '}
					{myPartsScreen.viewsSuffix}
				</Text>

				{items.map((part) => (
					<View
						key={part.id}
						style={{ flexDirection: 'row', gap: 12, borderRadius: 16, backgroundColor: c.card, padding: 10 }}
					>
						<PhotoPlaceholder width={80} height={80} radius={10} />
						<View style={{ flex: 1, gap: 6 }}>
							<Text style={{ fontSize: 15, lineHeight: 18.75, fontFamily: fontFamily(700), color: c.ink }}>{part.title}</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.inkSecondary }}>{part.car}</Text>
								{part.brandSlug ? <BrandLogo brand={brandBySlug(part.brandSlug)} size={18} /> : null}
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 17, fontFamily: fontFamily(800), color: c.ink }}>{part.price}</Text>
								<Badge label={part.available ? 'В наличии' : 'Нет'} tone={part.available ? 'success' : 'muted'} />
							</View>
						</View>
					</View>
				))}

				<View style={{ height: 72 }} />
			</ScrollView>

			<Pressable
				onPress={() => router.push('/new-part')}
				style={{
					position: 'absolute',
					alignSelf: 'center',
					bottom: 16,
					height: 56,
					borderRadius: 28,
					backgroundColor: c.brand,
					paddingHorizontal: 22,
					paddingLeft: 18,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 8,
					shadowColor: c.brand,
					shadowOpacity: 0.35,
					shadowOffset: { width: 0, height: 8 },
					shadowRadius: 20,
					elevation: 8,
				}}
			>
				<PlusIcon size={22} color="#FFFFFF" strokeWidth={2.6} />
				<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{myPartsScreen.fabLabel}</Text>
			</Pressable>
		</Screen>
	)
}
