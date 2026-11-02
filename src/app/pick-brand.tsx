import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { QueryErrorBanner, ScreenHeader } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { SearchIcon } from '@/components/icons'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { useSearchCount } from '@/api/catalog'
import { useBrands, useModels } from '@/api/directory'
import type { Brand } from '@/api/types'
import { toPartFilters, useCatalogFilters } from '@/store/useCatalogFilters'
import { t } from '@/i18n'

/** 28 «Марка авто» — for the catalog when the car is not in the garage. */
export default function PickBrandScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const filters = useCatalogFilters()
	const [q, setQ] = useState('')
	const [brand, setBrand] = useState<Brand | null>(filters.brand)
	const [modelId, setModelId] = useState<number | null>(filters.modelId)

	const searching = q.trim().length > 0
	const all = useBrands(searching ? { q: q.trim() } : {})
	const models = useModels(brand?.id)
	const count = useSearchCount(
		toPartFilters({ ...filters, carId: null, brand, modelId }),
		Boolean(brand)
	)
	const popular = searching ? [] : (all.data ?? []).filter((b) => b.popular)
	const others = searching ? (all.data ?? []) : (all.data ?? []).filter((b) => !b.popular)
	const model = models.data?.find((m) => m.id === modelId)

	const apply = (withModel: boolean) => {
		if (!brand) return
		filters.pickBrand(brand, withModel && model ? { id: model.id, label: model.label } : null)
		router.back()
	}

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<ScreenHeader inset title={t('Марка авто')} />

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
					<TextInput
						value={q}
						onChangeText={setQ}
						placeholder="Марка или модель"
						placeholderTextColor={c.fillInk}
						style={{ flex: 1, minWidth: 0, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>

				<QueryErrorBanner error={all.error} onRetry={() => all.refetch()} />

				{popular.length ? (
					<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ПОПУЛЯРНЫЕ</Text>
				) : null}

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{popular.map((b) => {
						const active = brand?.id === b.id
						return (
							<Pressable
								key={b.id}
								onPress={() => {
									setBrand(b)
									setModelId(null)
								}}
								style={{
									width: 83.5, // four per row: (358 − 3 × 8) / 4
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
								<Text style={{ fontSize: fs.xxs, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
									{b.shortName}
								</Text>
							</Pressable>
						)
					})}
				</View>

				{others.length ? (
					<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
						{searching ? 'НАЙДЕНО' : 'ВСЕ МАРКИ А–Я'}
					</Text>
				) : null}
				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					{others.map((b, i) => (
						<Pressable
							key={b.id}
							onPress={() => {
								setBrand(b)
								setModelId(null)
							}}
							style={{
								height: 56,
								paddingHorizontal: 16,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 12,
								backgroundColor: brand?.id === b.id ? c.brandTint : c.card,
								borderBottomWidth: i === others.length - 1 ? 0 : 2,
								borderBottomColor: c.surface,
							}}
						>
							<BrandLogo brand={b} size={34} />
							<Text style={{ flex: 1, fontSize: fs.base, fontFamily: fontFamily(400), color: c.ink }}>{b.name}</Text>
						</Pressable>
					))}
				</View>
				{brand ? <View style={{ height: 260 }} /> : null}
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
						shadowColor: fixed.shadow,
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
							<Text style={{ fontSize: fs.xxl, fontFamily: fontFamily(700), color: c.ink }}>{brand.name}</Text>
							<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>Выберите модель или пропустите</Text>
						</View>
					</View>

					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{(models.data ?? []).map((m) => {
							const active = modelId === m.id
							const label = m.label
							return (
								<Pressable
									key={m.id}
									onPress={() => setModelId(active ? null : m.id)}
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
									<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
										{label}
									</Text>
								</Pressable>
							)
						})}
					</View>

					<View style={{ flexDirection: 'row', gap: 8 }}>
						<Pressable
							onPress={() => apply(false)}
							style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}
						>
							<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>Все модели</Text>
						</Pressable>
						<Pressable
							onPress={() => apply(true)}
							style={{ flex: 1.4, height: 52, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
						>
							{count.data === undefined ? (
								<ActivityIndicator color={fixed.white} />
							) : (
								<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>Показать {count.data}</Text>
							)}
						</Pressable>
					</View>

					<Text onPress={() => router.push('/garage-add')} style={{ fontSize: fs.xs, fontFamily: fontFamily(400), color: c.muted }}>
						Добавить эту машину в <Text style={{ fontFamily: fontFamily(700), color: c.brandStrong }}>Мой гараж</Text>
					</Text>
				</View>
			) : null}
		</View>
	)
}
