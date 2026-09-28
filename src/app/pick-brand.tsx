import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { BrandLogo } from '@/components/ui/brand'
import { ChevronLeftIcon, SearchIcon } from '@/components/icons'
import { brandBySlug } from '@/data/brands'
import { fontFamily, raw, useColors } from '@/theme'
import { pickBrandScreen } from '@/mocks'

export default function PickBrandScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [slug, setSlug] = useState<string | null>(pickBrandScreen.selectedSlug)
	const [model, setModel] = useState(pickBrandScreen.sheet.activeModel)

	const brand = slug ? brandBySlug(slug) : null

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
					{pickBrandScreen.title}
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 14 }} showsVerticalScrollIndicator={false}>
				<View
					style={{
						height: 52,
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
					<Text style={{ fontSize: 16, fontFamily: fontFamily(400), color: '#7D7979' }}>{pickBrandScreen.searchPlaceholder}</Text>
				</View>

				<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
					{pickBrandScreen.popularLabel}
				</Text>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{pickBrandScreen.popularSlugs.map((s) => {
						const b = brandBySlug(s)
						const active = slug === s
						return (
							<Pressable
								key={s}
								onPress={() => setSlug(s)}
								style={{
									width: 84,
									height: 92,
									borderRadius: 14,
									backgroundColor: active ? c.brandTint : c.card,
									borderWidth: 2,
									borderColor: active ? c.brand : 'transparent',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 8,
								}}
							>
								<BrandLogo brand={b} size={40} />
								<Text style={{ fontSize: 12, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
									{b.name}
								</Text>
							</Pressable>
						)
					})}
				</View>

				<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
					{pickBrandScreen.allLabel}
				</Text>
			</ScrollView>

			{brand ? (
				<View
					style={{
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						backgroundColor: c.card,
						paddingTop: 10,
						paddingHorizontal: 16,
						paddingBottom: insets.bottom + 12,
						gap: 14,
						shadowColor: '#201F1D',
						shadowOpacity: 0.14,
						shadowOffset: { width: 0, height: -6 },
						shadowRadius: 20,
						elevation: 10,
					}}
				>
					<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<BrandLogo brand={brand} size={44} />
						<View style={{ gap: 2 }}>
							<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{brand.name}</Text>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{pickBrandScreen.sheet.subtitle}</Text>
						</View>
					</View>

					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{pickBrandScreen.sheet.models.map((label, i) => {
							const active = model === i
							return (
								<Pressable
									key={label}
									onPress={() => setModel(i)}
									style={{
										height: 44,
										paddingHorizontal: 14,
										borderRadius: 20,
										backgroundColor: active ? c.brandTint : c.surface,
										borderWidth: 2,
										borderColor: active ? c.brand : 'transparent',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
										{label}
									</Text>
								</Pressable>
							)
						})}
					</View>

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable
							style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: raw.fill, alignItems: 'center', justifyContent: 'center' }}
						>
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{pickBrandScreen.sheet.allModels}</Text>
						</Pressable>
						<Pressable
							onPress={() => router.push('/catalog')}
							style={{ flex: 1.4, height: 52, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
						>
							<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{pickBrandScreen.sheet.showLabel}</Text>
						</Pressable>
					</View>

					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						{pickBrandScreen.addToGarage} <Text style={{ fontFamily: fontFamily(700), color: c.brandStrong }}>{pickBrandScreen.addToGarageStrong}</Text>
					</Text>
				</View>
			) : null}
		</View>
	)
}
