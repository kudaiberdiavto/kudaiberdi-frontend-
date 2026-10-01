import { useEffect, useState } from 'react'
import { Image, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { BrandLogo, Chip, SectionLabel, ServiceIcon, SummaryChips } from '@/components/ui'
import { ServiceWizard } from '@/components/service-wizard'
import { ClockIcon, MapPinIcon, PhotoIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { type PendingMedia, useServiceMedia } from '@/api/media'
import { serviceName, useCreateServiceRequest, useServiceEstimate, useServiceTypes } from '@/api/services'
import type { ServiceDuration, ServiceWhen } from '@/api/types'
import { MARKET_POINT } from '@/data/service-types'
import { WHERE_OPTIONS, serviceCarLabel, useServiceDraft } from '@/store/useServiceDraft'

const WHEN: { value: ServiceWhen; label: string }[] = [
	{ value: 'NOW', label: 'Сейчас' },
	{ value: 'TODAY', label: 'Сегодня' },
	{ value: 'TOMORROW', label: 'Завтра' },
	{ value: 'AT_TIME', label: 'Время…' },
]
const TIMES = ['09:00', '12:00', '15:00', '18:00']
const DURATIONS: { value: ServiceDuration; minutes: number; words: string }[] = [
	{ value: 'MIN_15', minutes: 15, words: '15 минут' },
	{ value: 'MIN_30', minutes: 30, words: '30 минут' },
	{ value: 'HOUR_1', minutes: 60, words: '1 час' },
	{ value: 'HOUR_3', minutes: 180, words: '3 часа' },
]
const MIN_DESCRIPTION = 10
const MAX_MEDIA = 5

/** 36 «Заявка на услугу», шаг 4: what happened, photos, when, where → send. */
export default function ServiceDetailsScreen() {
	const c = useColors()
	const draft = useServiceDraft()
	const types = useServiceTypes().data
	const type = types.find((t) => t.code === draft.service)
	const uploads = useServiceMedia(MAX_MEDIA)
	const create = useCreateServiceRequest()
	// The service's default — the tow truck is urgent, 15 minutes.
	const [duration, setDuration] = useState(() => DURATIONS.find((d) => d.value === type?.defaultDuration) ?? DURATIONS[1])
	const [pickDuration, setPickDuration] = useState(false)
	// Distance to masters is counted from this point — the phone's location, else the market.
	const point = draft.lat !== null && draft.lng !== null ? { lat: draft.lat, lng: draft.lng } : MARKET_POINT
	const estimate = useServiceEstimate({
		service: draft.service ?? undefined,
		carId: draft.carId,
		brandId: draft.brand?.id,
		origin: draft.origin,
		...point,
		radiusKm: draft.radiusKm,
	})

	// Ask for the location once, quietly: «Поеду сам» works from the market point too.
	const { lat, set: setDraft } = draft
	useEffect(() => {
		if (lat !== null) return
		let cancelled = false
		;(async () => {
			try {
				if (!(await Location.requestForegroundPermissionsAsync()).granted) return
				const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
				if (!cancelled) setDraft({ lat: coords.latitude, lng: coords.longitude, located: true })
			} catch {}
		})()
		return () => {
			cancelled = true
		}
	}, [lat, setDraft])

	const recipients = estimate.data?.recipients
	const where = WHERE_OPTIONS.find((o) => o.value === draft.where) ?? WHERE_OPTIONS[0]
	const needsPoint = (type?.needsLocation ?? false) || draft.where !== 'I_COME'
	const pointMissing = needsPoint && !draft.located
	const text = draft.description.trim()
	const ready = Boolean(draft.service && draft.brand && (draft.carId || (draft.modelId && draft.year)) && draft.origin) && recipients !== 0 && text.length >= MIN_DESCRIPTION && !pointMissing && !uploads.uploading


	const send = () => {
		if (!ready || !draft.service || !draft.brand || !draft.origin) return
		create.mutate(
			{
				service: draft.service,
				// From the garage the server copies model and year; engine, fuel and origin may be corrected on 35.
				...(draft.carId ? { carId: draft.carId } : { brandId: draft.brand.id, modelId: draft.modelId ?? undefined, year: draft.year ?? undefined }),
				engineVolume: draft.engineVolume ?? undefined,
				fuel: draft.fuel ?? undefined,
				origin: draft.origin,
				description: text,
				mediaIds: uploads.mediaIds,
				when: draft.when,
				atTime: draft.when === 'AT_TIME' && draft.atTime ? draft.atTime : undefined,
				where: draft.where,
				...point,
				address: draft.address?.trim() || undefined,
				radiusKm: draft.radiusKm,
				duration: duration.value,
			},
			{
				onSuccess: (request) => {
					draft.reset()
					router.dismissTo('/buyer')
					router.push({ pathname: '/service-offers', params: { id: String(request.id) } })
				},
			}
		)
	}

	return (
		<ServiceWizard
			step={4}
			label="Описание и фото"
			button="Отправить заявку"
			disabled={!ready}
			loading={create.isPending}
			onNext={send}
			footer={create.error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{create.error.message}</Text> : null}
		>
			<SummaryChips
				items={[
					...(draft.service
						? [{ key: 'service', label: serviceName(types, draft.service, true), icon: <ServiceIcon code={draft.service} size={14} color={c.brandStrong} strokeWidth={2.4} /> }]
						: []),
					...(draft.brand ? [{ key: 'car', label: serviceCarLabel(draft), icon: <BrandLogo brand={draft.brand} size={18} /> }] : []),
				]}
			/>

			<SectionLabel>Что случилось</SectionLabel>
			<TextInput
				value={draft.description}
				onChangeText={(description) => draft.set({ description: description.slice(0, 500) })}
				placeholder="Например: стук спереди справа на кочках"
				placeholderTextColor={raw.fillInk}
				multiline
				textAlignVertical="top"
				style={{
					minHeight: 100,
					borderRadius: 12,
					backgroundColor: c.card,
					borderWidth: 2,
					borderColor: c.brand,
					paddingVertical: 10,
					paddingHorizontal: 14,
					fontSize: 15,
					lineHeight: 21,
					fontFamily: fontFamily(400),
					color: c.ink,
				}}
			/>

			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{uploads.items.map((item) => (
					<Pressable key={item.key} onPress={() => (item.status === 'error' ? uploads.retry(item.key) : uploads.remove(item.key))}>
						<MediaTile item={item} />
					</Pressable>
				))}
				{uploads.canAdd ? (
					<Pressable
						onPress={uploads.pick}
						style={{ width: 64, height: 64, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: raw.mapRowBorder, alignItems: 'center', justifyContent: 'center', gap: 2 }}
					>
						<PhotoIcon size={20} color={c.brandStrong} />
						<Text style={{ fontSize: 11, lineHeight: 13, fontFamily: fontFamily(700), color: c.brandStrong, textAlign: 'center' }}>Фото/{'\n'}видео</Text>
					</Pressable>
				) : null}
			</View>
			{uploads.items.some((i) => i.status === 'error') ? (
				<Text style={{ fontSize: 13, fontFamily: fontFamily(500), color: c.danger }}>
					{uploads.items.find((i) => i.status === 'error')?.error} · нажмите на вложение, чтобы повторить или убрать
				</Text>
			) : null}

			<SectionLabel>Когда удобно</SectionLabel>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{WHEN.map((option) => (
					<Chip
						key={option.value}
						label={option.value === 'AT_TIME' && draft.when === 'AT_TIME' && draft.atTime ? draft.atTime : option.label}
						radius={12}
						color={c.ink}
						selected={option.value === draft.when}
						onPress={() => draft.set({ when: option.value, atTime: option.value === 'AT_TIME' ? (draft.atTime ?? TIMES[2]) : null })}
					/>
				))}
			</View>
			{draft.when === 'AT_TIME' ? (
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{TIMES.map((time) => (
						<Chip key={time} label={time} height={36} radius={12} color={c.ink} selected={time === draft.atTime} onPress={() => draft.set({ atTime: time })} />
					))}
				</View>
			) : null}

			<SectionLabel>Где</SectionLabel>
			<Pressable
				onPress={() => router.push('/service-where')}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
					height: 48,
					borderRadius: 12,
					backgroundColor: c.card,
					borderWidth: 2,
					borderColor: pointMissing ? c.danger : c.border,
					paddingHorizontal: 14,
				}}
			>
				<MapPinIcon size={20} color={c.brandStrong} />
				<Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.ink }}>
					{where.label} · {pointMissing ? 'укажите точку' : draft.where === 'I_COME' ? `до ${draft.radiusKm} км` : (draft.address ?? 'точка указана')}
				</Text>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Изменить</Text>
			</Pressable>

			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, backgroundColor: c.brandTint, paddingVertical: 10, paddingHorizontal: 12 }}>
				<ClockIcon size={18} color={c.brandStrong} />
				<Text style={{ flex: 1, fontSize: 14, lineHeight: 18.9, fontFamily: fontFamily(400), color: '#1D2B53' }}>
					{recipients !== undefined ? (
						<>
							Заявку получат{' '}
							<Text style={{ fontFamily: fontFamily(700) }}>
								{recipients} {plural(recipients, ['мастер', 'мастера', 'мастеров'])}
							</Text>
							{estimate.data?.label ? ` · ${estimate.data.label}` : ''}.{' '}
						</>
					) : null}
					Ждём ответы <Text style={{ fontFamily: fontFamily(700) }}>{duration.words}</Text> ·{' '}
					<Text onPress={() => setPickDuration((v) => !v)} style={{ fontFamily: fontFamily(700), color: c.brandStrong }}>
						изменить
					</Text>
				</Text>
			</View>
			{pickDuration ? (
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{DURATIONS.map((option) => (
						<Chip
							key={option.value}
							label={option.minutes < 60 ? `${option.minutes} мин` : `${option.minutes / 60} ${plural(option.minutes / 60, ['час', 'часа', 'часов'])}`}
							height={36}
							radius={12}
							color={c.ink}
							selected={option.value === duration.value}
							onPress={() => {
								setDuration(option)
								setPickDuration(false)
							}}
						/>
					))}
				</View>
			) : null}
		</ServiceWizard>
	)
}

/** Attached photo or video [36]: video — its poster (or a dark tile) with ▶; fades while uploading. */
function MediaTile({ item }: { item: PendingMedia }) {
	const c = useColors()
	return (
		<View
			style={{
				width: 64,
				height: 64,
				borderRadius: 12,
				overflow: 'hidden',
				backgroundColor: '#2A2D33',
				opacity: item.status === 'uploading' ? 0.5 : 1,
				borderWidth: item.status === 'error' ? 2 : 0,
				borderColor: c.danger,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{item.previewUri ? <Image source={{ uri: item.previewUri }} style={{ position: 'absolute', width: 64, height: 64 }} /> : null}
			{item.kind === 'VIDEO' ? (
				<View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: 11, color: '#FFFFFF', marginLeft: 2 }}>▶</Text>
				</View>
			) : null}
			{item.kind === 'VIDEO' && item.source.durationSec ? (
				<Text style={{ position: 'absolute', right: 4, bottom: 3, fontSize: 10, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
					0:{String(Math.round(item.source.durationSec)).padStart(2, '0')}
				</Text>
			) : null}
		</View>
	)
}
