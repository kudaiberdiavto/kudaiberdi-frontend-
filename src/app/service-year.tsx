import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { BrandLogo, Chip, SectionLabel, Segmented, ServiceIcon, SummaryChips } from '@/components/ui'
import { ServiceWizard } from '@/components/service-wizard'
import { fontFamily, useColors } from '@/theme'
import { useModels } from '@/api/directory'
import { serviceName, useServiceTypes } from '@/api/services'
import { FUELS, ORIGINS, useServiceDraft } from '@/store/useServiceDraft'

const VOLUMES = [1.5, 1.8, 2.0, 2.4, 2.5, 3.5]
const MORE_VOLUMES = [1.0, 1.3, 1.6, 2.2, 2.7, 3.0, 3.3, 4.0, 4.6, 5.7]
const YEARS_SHOWN = 7

/** 35 «Заявка на услугу», шаг 3: year, engine volume, fuel, where the car is from. */
export default function ServiceYearScreen() {
	const c = useColors()
	const draft = useServiceDraft()
	const types = useServiceTypes().data
	const model = useModels(draft.brand?.id).data?.find((m) => m.id === draft.modelId)
	const [moreYears, setMoreYears] = useState(false)
	const [moreVolumes, setMoreVolumes] = useState(false)

	const now = new Date().getFullYear()
	const from = model?.yearFrom ?? now - 12
	const to = Math.min(model?.yearTo ?? now, now)
	const generation = Array.from({ length: Math.max(1, to - from + 1) }, (_, i) => from + i)
	const years = moreYears
		? Array.from({ length: 30 }, (_, i) => now - i)
		: [...generation.slice(0, YEARS_SHOWN), ...(draft.year && !generation.slice(0, YEARS_SHOWN).includes(draft.year) ? [draft.year] : [])]
	const volumes = moreVolumes
		? [...VOLUMES, ...MORE_VOLUMES].sort((a, b) => a - b)
		: [...VOLUMES, ...(draft.engineVolume && !VOLUMES.includes(draft.engineVolume) ? [draft.engineVolume] : [])]

	const tile = (active: boolean) => ({
		height: 52,
		borderRadius: 12,
		backgroundColor: active ? c.brandTint : c.card,
		borderWidth: 2,
		borderColor: active ? c.brand : c.border,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	})

	return (
		<ServiceWizard step={3} label="Год, объём, откуда машина" disabled={!draft.year || !draft.origin} onNext={() => router.push('/service-details')}>
			<SummaryChips
				items={[
					...(draft.service
						? [
								{
									key: 'service',
									label: serviceName(types, draft.service, true),
									icon: <ServiceIcon code={draft.service} size={14} color={c.brandStrong} strokeWidth={2.4} />,
								},
							]
						: []),
					...(draft.brand && draft.modelLabel ? [{ key: 'car', label: draft.modelLabel, icon: <BrandLogo brand={draft.brand} size={18} /> }] : []),
				]}
			/>

			<SectionLabel>Год выпуска</SectionLabel>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{years.map((year) => (
					<Chip
						key={year}
						label={String(year)}
						radius={12}
						color={c.ink}
						selected={year === draft.year} // Another year than in the garage: the server takes the year from `carId`, so send the car by hand.
						onPress={() => draft.setCar({ year, ...(year !== draft.year ? { carId: null } : {}) })}
					/>
				))}
				{!moreYears ? <Chip label="Другой" radius={12} color={c.ink} onPress={() => setMoreYears(true)} /> : null}
			</View>

			<SectionLabel>Объём двигателя, л</SectionLabel>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{volumes.map((volume) => (
					<Chip
						key={volume}
						label={volume.toFixed(1)}
						radius={12}
						color={c.ink}
						selected={volume === draft.engineVolume}
						onPress={() => draft.set({ engineVolume: volume })}
					/>
				))}
				{!moreVolumes ? <Chip label="Другой" radius={12} color={c.ink} onPress={() => setMoreVolumes(true)} /> : null}
			</View>

			<SectionLabel>Топливо</SectionLabel>
			<Segmented
				items={FUELS.map((f) => f.label)}
				value={Math.max(
					0,
					FUELS.findIndex((f) => f.value === draft.fuel)
				)}
				onChange={(i) => draft.set({ fuel: FUELS[i].value })}
				height={44}
				itemHeight={34}
				padding={3}
				gap={0}
				activeWeight={600}
				inactiveColor={c.muted}
				borderColor={c.border}
			/>

			<SectionLabel>Откуда машина</SectionLabel>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{ORIGINS.map((origin) => {
					const active = origin.value === draft.origin
					return (
						<Pressable key={origin.value} onPress={() => draft.set({ origin: origin.value })} style={[tile(active), { width: '31%', flexGrow: 1 }]}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>{origin.label}</Text>
							{origin.hint ? <Text style={{ fontSize: 11.5, fontFamily: fontFamily(400), color: active ? c.brandStrong : c.muted }}>{origin.hint}</Text> : null}
						</Pressable>
					)
				})}
			</View>
		</ServiceWizard>
	)
}
