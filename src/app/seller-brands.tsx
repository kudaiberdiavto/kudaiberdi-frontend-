import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { BrandLogo } from '@/components/ui/brand'
import { CheckIcon, ChevronLeftIcon, SearchIcon } from '@/components/icons'
import { brandBySlug, brands } from '@/data/brands'
import { fontFamily, useColors } from '@/theme'
import { sellerBrandsScreen } from '@/mocks'

export default function SellerBrandsScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [selected, setSelected] = useState(sellerBrandsScreen.selectedSlugs)

	const toggle = (slug: string) =>
		setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

	const otherBrands = brands.filter((b) => !sellerBrandsScreen.popularSlugs.includes(b.slug))

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<View
				style={{
					paddingTop: insets.top + 12,
					paddingHorizontal: 16,
					paddingBottom: 8,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>
					{sellerBrandsScreen.title}
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
				<View
					style={{
						height: 48,
						borderRadius: 12,
						backgroundColor: c.card,
						borderWidth: 2,
						borderColor: c.border,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
						paddingHorizontal: 12,
					}}
				>
					<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
					<Text style={{ fontSize: 16, fontFamily: fontFamily(400), color: '#7D7979' }}>{sellerBrandsScreen.searchPlaceholder}</Text>
				</View>

				<Text style={{ fontSize: 14, lineHeight: 19.6, fontFamily: fontFamily(400), color: c.muted }}>{sellerBrandsScreen.hint}</Text>

				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
						{sellerBrandsScreen.popularLabel}
					</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>Выбрано {selected.length}</Text>
				</View>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{sellerBrandsScreen.popularSlugs.map((slug) => {
						const brand = brandBySlug(slug)
						const active = selected.includes(slug)
						return (
							<Pressable
								key={slug}
								onPress={() => toggle(slug)}
								style={{
									width: 84,
									height: 96,
									borderRadius: 14,
									backgroundColor: active ? c.brandTint : c.card,
									borderWidth: 2,
									borderColor: active ? c.brand : 'transparent',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 8,
								}}
							>
								<View>
									<BrandLogo brand={brand} size={40} />
									{active ? (
										<View
											style={{
												position: 'absolute',
												right: -6,
												top: -6,
												width: 20,
												height: 20,
												borderRadius: 10,
												backgroundColor: c.brand,
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<CheckIcon size={13} color="#FFFFFF" strokeWidth={3} />
										</View>
									) : null}
								</View>
								<Text
									style={{ fontSize: 12, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}
								>
									{brand.name}
								</Text>
							</Pressable>
						)
					})}
				</View>

				<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
					{sellerBrandsScreen.allLabel}
				</Text>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					{otherBrands.map((brand, i) => {
						const active = selected.includes(brand.slug)
						return (
							<Pressable
								key={brand.slug}
								onPress={() => toggle(brand.slug)}
								style={{
									height: 56,
									paddingHorizontal: 16,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 12,
									borderBottomWidth: i === otherBrands.length - 1 ? 0 : 2,
									borderBottomColor: c.surface,
								}}
							>
								<BrandLogo brand={brand} size={34} />
								<Text style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(400), color: c.ink }}>{brand.name}</Text>
								<View
									style={{
										width: 24,
										height: 24,
										borderRadius: 7,
										borderWidth: 2,
										borderColor: active ? c.brand : c.border,
										backgroundColor: active ? c.brand : 'transparent',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									{active ? <CheckIcon size={14} color="#FFFFFF" strokeWidth={3} /> : null}
								</View>
							</Pressable>
						)
					})}
				</View>
			</ScrollView>

			<View
				style={{
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: insets.bottom + 12,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					backgroundColor: c.card,
				}}
			>
				<Pressable
					onPress={() => router.back()}
					style={{ height: 56, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
				>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Сохранить · {selected.length} марки</Text>
				</Pressable>
			</View>
		</View>
	)
}
