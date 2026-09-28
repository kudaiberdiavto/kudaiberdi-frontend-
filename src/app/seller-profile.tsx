import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LocationCard, ProductCard } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { ChatIcon, ChevronLeftIcon, GalleryIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { brandBySlug } from '@/data/brands'
import { fontFamily, raw, useColors } from '@/theme'
import { sellerProfileForBuyer } from '@/mocks'

export default function SellerProfileForBuyerScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View>
					<View style={{ width: '100%', height: 210, backgroundColor: raw.fill }} />
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
						<View style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(32,31,29,0.6)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
							<GalleryIcon size={14} color="#FFFFFF" />
							<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{sellerProfileForBuyer.photosCount}</Text>
						</View>
					</View>
				</View>

				<View style={{ marginTop: -44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
					<View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: raw.fill, borderWidth: 4, borderColor: c.surface }} />
					<View
						style={{
							height: 30,
							paddingHorizontal: 12,
							borderRadius: 15,
							backgroundColor: c.successTint,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.success }}>{sellerProfileForBuyer.openLabel}</Text>
					</View>
				</View>

				<View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 14 }}>
					<View style={{ gap: 2 }}>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>{sellerProfileForBuyer.name}</Text>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{sellerProfileForBuyer.rating}</Text>
					</View>

					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 14 }}>
						<LocationCard rowLabel={sellerProfileForBuyer.rowLabel} boxLabel={sellerProfileForBuyer.boxNumber} />
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.inkSecondary }}>{sellerProfileForBuyer.side}</Text>
							<Pressable
								onPress={() => router.push('/route')}
								style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: c.brandTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}
							>
								<MapPinIcon size={16} color={c.brandStrong} />
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{sellerProfileForBuyer.onMap}</Text>
							</Pressable>
						</View>
					</View>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
							{sellerProfileForBuyer.brandsLabel}
						</Text>
						<View style={{ flexDirection: 'row' }}>
							{sellerProfileForBuyer.brandSlugs.map((slug, i) => (
								<View key={slug} style={{ marginLeft: i === 0 ? 0 : -8 }}>
									<BrandLogo brand={brandBySlug(slug)} size={36} />
								</View>
							))}
							{sellerProfileForBuyer.moreBrands ? (
								<View
									style={{
										marginLeft: -8,
										width: 36,
										height: 36,
										borderRadius: 18,
										backgroundColor: c.card,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>+{sellerProfileForBuyer.moreBrands}</Text>
								</View>
							) : null}
						</View>
					</View>

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable
							onPress={() => router.push('/chat')}
							style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: c.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<ChatIcon size={20} color="#FFFFFF" />
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{sellerProfileForBuyer.actions.message}</Text>
						</Pressable>
						<Pressable
							onPress={() => router.push('/route')}
							style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: raw.fill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
						>
							<MapPinIcon size={20} color={c.ink} />
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{sellerProfileForBuyer.actions.route}</Text>
						</Pressable>
						<Pressable
							style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: raw.fill, alignItems: 'center', justifyContent: 'center' }}
						>
							<PhoneIcon size={20} color={c.ink} />
						</Pressable>
					</View>

					<View style={{ flexDirection: 'row', gap: 20 }}>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>{sellerProfileForBuyer.tabs.parts}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.muted }}>{sellerProfileForBuyer.tabs.photos}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.muted }}>{sellerProfileForBuyer.tabs.reviews}</Text>
					</View>

					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 }}>
						{sellerProfileForBuyer.items.map((item) => (
							<ProductCard
								key={item.id}
								price={item.price}
								title={item.title}
								fits={item.fits}
								location={item.location}
								onPress={() => router.push('/part')}
							/>
						))}
					</View>
				</View>
			</ScrollView>
		</View>
	)
}
