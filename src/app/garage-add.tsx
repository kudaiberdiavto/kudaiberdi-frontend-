import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BottomSheet, BrandLogo, Button, QueryErrorBanner } from '@/components/ui'
import { ChevronLeftIcon, SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { useBrands, useModels } from '@/api/directory'
import { useAddCar } from '@/api/garage'
import type { Brand, CarModel, CarOrigin, FuelType } from '@/api/types'
import { FUELS, ORIGINS } from '@/store/useServiceDraft'

const VOLUMES = [1.3, 1.5, 1.8, 2.0, 2.4, 2.5, 3.0, 3.5, 4.0]

/** Years for the picker: the model's generation years, newest first (or the last 30 years). */
function yearsOf(model: CarModel | undefined) {
	const now = new Date().getFullYear()
	const to = Math.min(model?.yearTo ?? now, now)
	const from = model?.yearFrom ?? now - 30
	return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => to - i)
}

/** Add a car to the garage — no mockup; built from screen 28 (brand tiles + model sheet). */
export default function GarageAddScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	// From «Фото техпаспорта» [04] when the model wasn't read: what was read is prefilled.
	const passport = useLocalSearchParams<{ brand?: string; year?: string; vin?: string; engineVolume?: string; fuel?: string }>()
	const [q, setQ] = useState('')
	const [brand, setBrand] = useState<Brand | null>(() => (passport.brand ? (JSON.parse(passport.brand) as Brand) : null))
	const [modelId, setModelId] = useState<number | null>(null)
	const [year, setYear] = useState<number | null>(passport.year ? Number(passport.year) : null)
	// Optional — masters filter by them [33–36]; origin defaults on the server by brand.
	const [engineVolume, setEngineVolume] = useState<number | null>(passport.engineVolume ? Number(passport.engineVolume) : null)
	const [fuel, setFuel] = useState<FuelType | null>((passport.fuel as FuelType | undefined) ?? null)
	const [origin, setOrigin] = useState<CarOrigin | null>(null)

	const all = useBrands(q.trim() ? { q: q.trim() } : {})
	const models = useModels(brand?.id)
	const addCar = useAddCar()

	const brands = all.data ?? []
	const popular = q.trim() ? [] : brands.filter((b) => b.popular)
	const rest = q.trim() ? brands : brands.filter((b) => !b.popular)
	const model = models.data?.find((m) => m.id === modelId)

	const pickBrand = (next: Brand) => {
		setBrand(next)
		setModelId(null)
		setYear(null)
		setOrigin(null)
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
					Добавить машину
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
				<BottomSheet
					onClose={() => setBrand(null)}
					header={
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
							<BrandLogo brand={brand} size={44} />
							<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{brand.name}</Text>
						</View>
					}
					footer={
						<>
							{addCar.error ? (
								<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{addCar.error.message}</Text>
							) : null}
							<Button
								label="Добавить в гараж"
								height={52}
								disabled={!modelId || !year}
								loading={addCar.isPending}
								onPress={() =>
									modelId &&
									year &&
									addCar.mutate(
										{
											modelId,
											year,
											engineVolume: engineVolume ?? undefined,
											fuel: fuel ?? undefined,
											origin: origin ?? undefined,
											vin: passport.vin || undefined,
											fromTechPassport: Boolean(passport.brand) || undefined,
										},
										{ onSuccess: () => router.back() }
									)
								}
							/>
						</>
					}
				>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>МОДЕЛЬ</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{(models.data ?? []).map((m) => chip(m.label, m.id === modelId, () => {
							setModelId(m.id)
							setYear(null)
						}, m.id))}
					</View>

					{model ? (
						<>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ГОД</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
								{yearsOf(model).map((y) => chip(String(y), y === year, () => setYear(y), y))}
							</ScrollView>
						</>
					) : null}

					{year ? (
						<>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ОБЪЁМ, Л · НЕОБЯЗАТЕЛЬНО</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
								{VOLUMES.map((v) => chip(v.toFixed(1), v === engineVolume, () => setEngineVolume(v === engineVolume ? null : v), v))}
							</ScrollView>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ТОПЛИВО</Text>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
								{FUELS.map((f) => chip(f.label, f.value === fuel, () => setFuel(f.value === fuel ? null : f.value), f.value))}
							</View>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>ОТКУДА МАШИНА</Text>
							<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
								{ORIGINS.filter((o) => o.value !== 'UNKNOWN').map((o) => chip(o.label, o.value === origin, () => setOrigin(o.value === origin ? null : o.value), o.value))}
							</View>
						</>
					) : null}
				</BottomSheet>
			) : null}
		</View>
	)
}
