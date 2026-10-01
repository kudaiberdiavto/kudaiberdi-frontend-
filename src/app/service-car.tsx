import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { BrandLogo, Chip, SectionLabel, ServiceIcon, SummaryChips } from '@/components/ui'
import { ServiceWizard } from '@/components/service-wizard'
import { CheckIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { useBrands, useModels } from '@/api/directory'
import { useCars } from '@/api/garage'
import { serviceName, useServiceTypes } from '@/api/services'
import type { Brand, Car } from '@/api/types'
import { serviceCarLabel, useServiceDraft } from '@/store/useServiceDraft'

const MODELS_SHOWN = 7

/** «2.5» from the garage's free-text engine («2.5», «2.5 л», «2AZ 2.4»). */
function engineVolumeOf(engine: string | null) {
	const match = engine?.replace(',', '.').match(/\d\.\d/)
	return match ? Number(match[0]) : null
}

/** 34 «Заявка на услугу», шаг 2: a car from the garage in one tap, or brand → model. */
export default function ServiceCarScreen() {
	const c = useColors()
	const draft = useServiceDraft()
	const types = useServiceTypes().data
	const cars = useCars().data ?? []
	const brands = (useBrands({ popular: true }).data ?? []).slice(0, 8)
	const models = useModels(draft.brand?.id).data ?? []
	const [allModels, setAllModels] = useState(false)

	const pickGarage = (car: Car) =>
		draft.setCar({
			carId: car.id,
			brand: car.brand,
			modelId: car.model.id,
			modelLabel: car.model.label,
			year: car.year,
			engineVolume: car.engineVolume ?? engineVolumeOf(car.engine),
			fuel: car.fuel ?? 'PETROL',
			origin: car.origin,
		})

	const pickBrand = (brand: Brand) => {
		if (brand.id === draft.brand?.id && !draft.carId) return
		draft.setCar({ carId: null, brand, modelId: null, modelLabel: null, year: null, engineVolume: null, origin: null })
		setAllModels(false)
	}

	const shownModels = allModels ? models : models.slice(0, MODELS_SHOWN)
	// Selected brand not among the popular ones (came from the garage) — keep it visible.
	const brandTiles = draft.brand && !brands.some((b) => b.id === draft.brand!.id) ? [draft.brand, ...brands.slice(0, 7)] : brands

	return (
		<ServiceWizard step={2} label="Машина" disabled={!draft.brand || !draft.modelId} onNext={() => router.push('/service-year')}>
			{draft.service ? (
				<SummaryChips
					items={[{ key: 'service', label: serviceName(types, draft.service), icon: <ServiceIcon code={draft.service} size={14} color={c.brandStrong} strokeWidth={2.4} /> }]}
				/>
			) : null}

			{cars.map((car) => {
				const selected = draft.carId === car.id
				return (
					<Pressable
						key={car.id}
						onPress={() => pickGarage(car)}
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: 12,
							borderRadius: 14,
							backgroundColor: c.card,
							borderWidth: 2,
							borderColor: selected ? c.brand : 'transparent',
							paddingVertical: 10,
							paddingHorizontal: 12,
						}}
					>
						<BrandLogo brand={car.brand} size={36} />
						<View style={{ flex: 1, gap: 2 }}>
							<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
								{selected ? serviceCarLabel(draft) : serviceCarLabel({ modelLabel: car.model.label, year: car.year, engineVolume: car.engineVolume ?? engineVolumeOf(car.engine), origin: car.origin })}
							</Text>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>Из гаража — заполнит всё сразу</Text>
						</View>
						{selected ? (
							<View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
								<CheckIcon size={14} color="#FFFFFF" strokeWidth={3} />
							</View>
						) : null}
					</Pressable>
				)
			})}

			{cars.length ? <SectionLabel>Или другая машина</SectionLabel> : null}
			<SectionLabel>Марка</SectionLabel>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{brandTiles.map((brand) => {
					const selected = brand.id === draft.brand?.id
					return (
						<Pressable
							key={brand.id}
							onPress={() => pickBrand(brand)}
							style={{
								width: '23%',
								flexGrow: 1,
								height: 78,
								borderRadius: 14,
								backgroundColor: selected ? c.brandTint : c.card,
								borderWidth: 2,
								borderColor: selected ? c.brand : 'transparent',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 6,
							}}
						>
							<BrandLogo brand={brand} size={34} />
							<Text style={{ fontSize: 12, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? c.brandStrong : c.ink }}>{brand.shortName}</Text>
						</Pressable>
					)
				})}
			</View>

			{draft.brand ? (
				<>
					<SectionLabel>Модель</SectionLabel>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{shownModels.map((model) => (
							<Chip
								key={model.id}
								label={model.label}
								radius={12}
								color={c.ink}
								selected={model.id === draft.modelId}
								onPress={() => draft.setCar({ carId: null, modelId: model.id, modelLabel: model.label, year: null })}
							/>
						))}
						{!allModels && models.length > MODELS_SHOWN ? <Chip label="Все модели ›" radius={12} color={c.ink} onPress={() => setAllModels(true)} /> : null}
					</View>
				</>
			) : null}
		</ServiceWizard>
	)
}
