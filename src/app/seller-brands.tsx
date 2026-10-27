import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CheckIcon, ChevronLeftIcon, SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { useBrands } from '@/api/directory'
import { useMyShop, useSetShopBrands } from '@/api/shop'

/** 23 «Марки, которые продаю» — requests come only for these brands. */
export default function SellerBrandsScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const shop = useMyShop()
	const [q, setQ] = useState('')
	const all = useBrands(q.trim() ? { q: q.trim() } : {})
	const save = useSetShopBrands()
	const [picked, setPicked] = useState<number[] | null>(null)
	const selected = picked ?? shop.data?.brands.map((b) => b.id) ?? []

	const toggle = (id: number) => setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

	const searching = q.trim().length > 0
	const popularBrands = searching ? [] : (all.data ?? []).filter((b) => b.popular)
	const otherBrands = searching ? (all.data ?? []) : (all.data ?? []).filter((b) => !b.popular)

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
					Марки, которые продаю
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
					<TextInput
						value={q}
						onChangeText={setQ}
						placeholder="Найти марку"
						placeholderTextColor="#7D7979"
						style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>

				<QueryErrorBanner error={shop.error ?? all.error ?? save.error} onRetry={() => all.refetch()} />

				<Text style={{ fontSize: 15.5, lineHeight: 21.5, fontFamily: fontFamily(400), color: c.muted }}>
					Запросы будут приходить только по этим маркам. Логотипы видят покупатели в вашем профиле.
				</Text>

				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
						{searching ? 'НАЙДЕНО' : 'ПОПУЛЯРНЫЕ'}
					</Text>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Выбрано {selected.length}</Text>
				</View>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{popularBrands.map((brand) => {
						const active = selected.includes(brand.id)
						return (
							<Pressable
								key={brand.id}
								onPress={() => toggle(brand.id)}
								style={{
									// Four per row: (358 − 3 × 8) / 4.
									width: 83.5,
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
									style={{ fontSize: 13, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}
								>
									{brand.shortName}
								</Text>
							</Pressable>
						)
					})}
				</View>

				{!searching ? (
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
						ВСЕ МАРКИ А–Я
					</Text>
				) : null}

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					{otherBrands.map((brand, i) => {
						const active = selected.includes(brand.id)
						return (
							<Pressable
								key={brand.id}
								onPress={() => toggle(brand.id)}
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
								<Text style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(400), color: c.ink }}>{brand.name}</Text>
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
					disabled={selected.length === 0 || save.isPending}
					onPress={() => save.mutate(selected, { onSuccess: () => router.back() })}
					style={{
						height: 56,
						borderRadius: 14,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
						opacity: selected.length === 0 ? 0.4 : 1,
					}}
				>
					{save.isPending ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
							Сохранить · {selected.length} {plural(selected.length, ['марка', 'марки', 'марок'])}
						</Text>
					)}
				</Pressable>
			</View>
		</View>
	)
}
