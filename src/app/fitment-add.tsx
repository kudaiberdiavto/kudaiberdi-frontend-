import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { BrandLogo, Button, QueryErrorBanner } from '@/components/ui'
import { ChevronLeftIcon, SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { useBrands, useModels } from '@/api/directory'
import type { Brand, CarModel } from '@/api/types'
import { usePartDraft } from '@/store/usePartDraft'

const ALL_MODELS = -1

/** «Camry 50 · 2011–17» — generation years make the chip clear. */
function fitmentLabel(model: CarModel) {
	if (!model.yearFrom) return model.label
	const to = model.yearTo ? `–${String(model.yearTo).slice(-2)}` : '+'
	return `${model.label} · ${model.yearFrom}${to}`
}

/**
 * «Подходит к машинам» of a part [26] — no mockup; built from screen 28 like «Добавить машину».
 * Several models at once; «Все модели» fits the whole brand.
 */
export default function FitmentAddScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [q, setQ] = useState('')
	const [brand, setBrand] = useState<Brand | null>(null)
	const [picked, setPicked] = useState<number[]>([])
	const addFitment = usePartDraft((d) => d.addFitment)

	const all = useBrands(q.trim() ? { q: q.trim() } : {})
	const models = useModels(brand?.id)

	const brands = all.data ?? []
	const popular = q.trim() ? [] : brands.filter((b) => b.popular)
	const rest = q.trim() ? brands : brands.filter((b) => !b.popular)

	const pickBrand = (next: Brand) => {
		setBrand(next)
		setPicked([])
	}

	const toggleModel = (id: number) =>
		setPicked((list) =>
			id === ALL_MODELS
				? list.includes(ALL_MODELS) ? [] : [ALL_MODELS]
				: list.includes(id)
					? list.filter((x) => x !== id)
					: [...list.filter((x) => x !== ALL_MODELS), id]
		)

	const add = () => {
		if (!brand) return
		if (picked.includes(ALL_MODELS)) {
			addFitment({ brandId: brand.id, brand, label: `${brand.shortName} · все модели` })
		} else {
			for (const model of models.data ?? []) {
				if (!picked.includes(model.id)) continue
				addFitment({
					brandId: brand.id,
					brand,
					modelId: model.id,
					yearFrom: model.yearFrom ?? undefined,
					yearTo: model.yearTo ?? undefined,
					label: fitmentLabel(model),
				})
			}
		}
		router.back()
	}

	const chip = (label: string, active: boolean, onPress: () => void, key: string | number) => (
		<Pressable
			key={key}
			onPress={onPress}
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
					Подходит к машинам
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
					<TextInput
						value={q}
						onChangeText={setQ}
						placeholder="Марка: Toyota, мерс, бэха…"
						placeholderTextColor="#7D7979"
						style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>

				<QueryErrorBanner error={all.error} onRetry={() => all.refetch()} />

				{popular.length ? (
					<>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
							ПОПУЛЯРНЫЕ
						</Text>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{popular.map((b) => {
								const active = brand?.id === b.id
								return (
									<Pressable
										key={b.id}
										onPress={() => pickBrand(b)}
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
										<Text style={{ fontSize: 12, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
											{b.shortName}
										</Text>
									</Pressable>
								)
							})}
						</View>
					</>
				) : null}

				{rest.length ? (
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
						{q.trim() ? 'НАЙДЕНО' : 'ВСЕ МАРКИ А–Я'}
					</Text>
				) : null}
				{rest.map((b) => (
					<Pressable
						key={b.id}
						onPress={() => pickBrand(b)}
						style={{
							height: 56,
							borderRadius: 14,
							backgroundColor: brand?.id === b.id ? c.brandTint : c.card,
							paddingHorizontal: 12,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 12,
						}}
					>
						<BrandLogo brand={b} size={32} />
						<Text style={{ fontSize: 16, fontFamily: fontFamily(600), color: c.ink }}>{b.name}</Text>
					</Pressable>
				))}
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
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{brand.name}</Text>
					</View>

					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>МОДЕЛИ</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{chip('Все модели', picked.includes(ALL_MODELS), () => toggleModel(ALL_MODELS), ALL_MODELS)}
						{(models.data ?? []).map((m) => chip(fitmentLabel(m), picked.includes(m.id), () => toggleModel(m.id), m.id))}
					</View>

					<Button
						label={picked.length > 1 ? `Добавить · ${picked.length}` : 'Добавить'}
						height={52}
						disabled={picked.length === 0}
						onPress={add}
					/>
				</View>
			) : null}
		</View>
	)
}
