import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, QueryErrorBanner } from '@/components/ui'
import { ChevronLeftIcon, CloseIcon } from '@/components/icons'
import { SelectField, SelectSheet } from '@/components/select-sheet'
import { fontFamily, useColors } from '@/theme'
import { useBrands, useModels } from '@/api/directory'
import type { CarModel } from '@/api/types'
import { usePartDraft } from '@/store/usePartDraft'
import { t } from '@/i18n'

const ALL_MODELS = -1

/** «Camry 50 · 2011–17» — generation years make the chip clear. */
function fitmentLabel(model: CarModel) {
	if (!model.yearFrom) return model.label
	const to = model.yearTo ? `–${String(model.yearTo).slice(-2)}` : '+'
	return `${model.label} · ${model.yearFrom}${to}`
}

/**
 * «Подходит к машинам» of a part [26]: the brand and the models from dropdowns with search (as in «Добавить машину»).
 * Several models of one brand at once; «Все модели» — the whole brand.
 */
export default function FitmentAddScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [brandId, setBrandId] = useState<number | null>(null)
	const [picked, setPicked] = useState<number[]>([])
	const [picking, setPicking] = useState<'brand' | 'model' | null>(null)
	const addFitment = usePartDraft((d) => d.addFitment)

	const [brandQuery, setBrandQuery] = useState('')
	// The server knows the aliases: «мерс» → Mercedes-Benz, «бэха» → BMW.
	const brands = useBrands(brandQuery ? { q: brandQuery } : {})
	const allBrands = useBrands()
	const brand = allBrands.data?.find((b) => b.id === brandId) ?? null
	const models = useModels(brandId ?? undefined)
	const modelList = models.data ?? []

	const pickModel = (id: number) =>
		setPicked((list) => (id === ALL_MODELS ? [ALL_MODELS] : list.includes(id) ? list : [...list.filter((x) => x !== ALL_MODELS), id]))

	const pickedLabel = (id: number) => {
		if (id === ALL_MODELS) return t('Все модели')
		const model = modelList.find((m) => m.id === id)
		return model ? fitmentLabel(model) : ''
	}

	const add = () => {
		if (!brand) return
		if (picked.includes(ALL_MODELS)) {
			addFitment({ brandId: brand.id, brand, label: t('{0} · все модели', brand.shortName) })
		} else {
			for (const model of modelList) {
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

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Pressable accessibilityRole="button" accessibilityLabel={t('Назад')} onPress={() => router.back()} hitSlop={10}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>{t('Подходит к машинам')}</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 16 }} keyboardShouldPersistTaps="handled">
				<QueryErrorBanner error={brands.error ?? models.error} onRetry={() => (brands.refetch(), models.refetch())} />
				<SelectField label={t('Марка')} value={brand?.name} placeholder={t('Выберите марку')} onPress={() => setPicking('brand')} />
				<SelectField
					label={t('Модели')}
					value={null}
					placeholder={picked.length ? t('Добавить ещё модель') : t('Выберите модель')}
					disabled={!brand}
					onPress={() => setPicking('model')}
				/>

				{picked.length ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{picked.map((id) => (
							<Pressable
								key={id}
								onPress={() => setPicked((list) => list.filter((x) => x !== id))}
								style={{
									height: 40,
									paddingLeft: 14,
									paddingRight: 10,
									borderRadius: 20,
									backgroundColor: c.brandTint,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 6,
								}}
							>
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{pickedLabel(id)}</Text>
								<CloseIcon size={14} color={c.brandStrong} />
							</Pressable>
						))}
					</View>
				) : null}
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12 }}>
				<Button label={picked.length > 1 ? t('Добавить · {0}', picked.length) : t('Добавить')} disabled={!brand || picked.length === 0} onPress={add} />
			</View>

			{picking === 'brand' ? (
				<SelectSheet
					title={t('Марка')}
					searchPlaceholder={t('Toyota, мерс, бэха…')}
					options={(brands.data ?? []).map((b) => ({ key: b.id, label: b.name }))}
					selected={brandId}
					onSearch={setBrandQuery}
					onPick={(id) => {
						if (id !== brandId) setPicked([])
						setBrandId(id)
					}}
					onClose={() => {
						setPicking(null)
						setBrandQuery('')
					}}
				/>
			) : null}
			{picking === 'model' && brand ? (
				<SelectSheet
					title={brand.name}
					searchPlaceholder={t('Модель')}
					options={[
						{ key: ALL_MODELS, label: t('Все модели') },
						...modelList.map((m) => ({
							key: m.id,
							label: m.label,
							sub: m.yearFrom ? `${m.yearFrom}–${m.yearTo ?? t('н.в.')}` : null,
						})),
					]}
					selected={picked[picked.length - 1] ?? null}
					onPick={pickModel}
					onClose={() => setPicking(null)}
				/>
			) : null}
		</View>
	)
}
