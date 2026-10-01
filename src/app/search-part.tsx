import { useState } from 'react'
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, DURATION_OPTIONS, DurationPicker, QueryErrorBanner, Segmented } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CloseIcon, LocateIcon, MarketIcon, PhotoIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { useCars } from '@/api/garage'
import { usePhotoUploads } from '@/api/media'
import { useCreateRequest, useRecipientsEstimate } from '@/api/requests'
import type { RequestTarget } from '@/api/types'
import { audienceOf, useRequestDraft } from '@/store/useRequestDraft'

const TARGETS: { value: RequestTarget; label: string }[] = [
	{ value: 'MARKET', label: 'Всему рынку' },
	{ value: 'ROWS', label: 'Рядам' },
	{ value: 'CONTAINERS', label: 'Контейнерам' },
]

/** «рядах 14 и Ц», «рядах 14, 16 и Ц». */
function joinCodes(codes: string[]) {
	return codes.length > 1 ? `${codes.slice(0, -1).join(', ')} и ${codes[codes.length - 1]}` : (codes[0] ?? '')
}

/** 06б «Найти запчасть» v2: car, what, photo, audience (market / rows / boxes), how long to wait. */
export default function SearchPartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	// «Не нашли? Спросите весь рынок» from the catalog [27] passes the query and car.
	const params = useLocalSearchParams<{ text?: string; carId?: string }>()
	const cars = useCars()
	const [pickedCarId, setCarId] = useState<number | null>(params.carId ? Number(params.carId) : null)
	const [part, setPart] = useState(params.text ?? '')
	const draft = useRequestDraft()
	const uploads = usePhotoUploads('REQUEST', 3)
	const create = useCreateRequest()

	const carList = cars.data ?? []
	const carId = pickedCarId ?? carList.find((car) => car.isPrimary)?.id ?? carList[0]?.id
	const audience = audienceOf(draft)
	const audienceReady =
		draft.target === 'MARKET' || (audience.rowIds?.length ?? 0) > 0 || (audience.containerIds?.length ?? 0) > 0
	const estimate = useRecipientsEstimate({ carId, ...audience }, Boolean(carId) && audienceReady)
	const recipients = estimate.data?.recipients
	const text = part.trim()
	const duration = DURATION_OPTIONS.find((d) => d.value === draft.duration) ?? DURATION_OPTIONS[0]

	// «в рядах 14 и Ц» / «в 3 боксах» / «на всём рынке»
	const where =
		draft.target === 'ROWS'
			? `в ${draft.rows.length > 1 ? 'рядах' : 'ряду'} ${joinCodes(draft.rows.map((r) => r.code))}`
			: draft.target === 'CONTAINERS'
				? `в ${draft.containers.length} ${plural(draft.containers.length, ['боксе', 'боксах', 'боксах'])}`
				: 'на всём рынке'

	const send = () =>
		carId &&
		create.mutate(
			{
				carId,
				text,
				target: audience.target,
				targetRowIds: audience.rowIds,
				targetContainerIds: audience.containerIds,
				duration: draft.duration,
				mediaIds: uploads.mediaIds,
			},
			{
				onSuccess: (r) => {
					draft.reset()
					router.replace({ pathname: '/buyer/requests', params: { id: String(r.id) } })
				},
			}
		)

	const chip = (label: string, onRemove: () => void, key: string | number) => (
		<Pressable
			key={key}
			onPress={onRemove}
			style={{
				height: 36,
				paddingLeft: 14,
				paddingRight: 10,
				borderRadius: 18,
				backgroundColor: c.brandTint,
				borderWidth: 2,
				borderColor: c.brand,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 6,
			}}
		>
			<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{label}</Text>
			<CloseIcon size={14} color={c.brandStrong} strokeWidth={2.8} />
		</Pressable>
	)

	const sectionLabel = (label: string) => (
		<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>{label.toUpperCase()}</Text>
	)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Text style={{ flex: 1, fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>
					Найти запчасть
				</Text>
				<Pressable onPress={() => router.back()}>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.muted }}>Отмена</Text>
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<QueryErrorBanner error={cars.error} onRetry={() => cars.refetch()} />

				{sectionLabel('Машина')}
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
					{carList.map((car) => {
						const active = carId === car.id
						return (
							<Pressable
								key={car.id}
								onPress={() => setCarId(car.id)}
								style={{
									height: 40,
									paddingLeft: 6,
									paddingRight: 14,
									borderRadius: 20,
									backgroundColor: active ? c.brandTint : c.card,
									borderWidth: 2,
									borderColor: active ? c.brand : c.border,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<BrandLogo brand={car.brand} size={28} />
								<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.inkSecondary }}>
									{car.label}
								</Text>
							</Pressable>
						)
					})}
					{cars.isSuccess && carList.length === 0 ? (
						<Pressable
							onPress={() => router.push('/garage-add')}
							style={{
								height: 40,
								paddingHorizontal: 14,
								borderRadius: 20,
								borderWidth: 2,
								borderStyle: 'dashed',
								borderColor: raw.mapRowBorder,
								justifyContent: 'center',
							}}
						>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>+ Добавить машину</Text>
						</Pressable>
					) : null}
				</ScrollView>

				{sectionLabel('Что нужно')}
				<View
					style={{
						height: 48,
						borderRadius: 12,
						backgroundColor: c.card,
						borderWidth: 2,
						borderColor: c.brand,
						paddingHorizontal: 14,
						justifyContent: 'center',
					}}
				>
					<TextInput
						value={part}
						onChangeText={setPart}
						maxLength={200}
						placeholder="Например: стойки передние, пара"
						placeholderTextColor={raw.fillInk}
						style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>

				<Pressable
					onPress={() => uploads.canAdd && uploads.pick('library')}
					onLongPress={() => uploads.canAdd && uploads.pick('camera')}
					style={{
						height: 48,
						borderRadius: 12,
						borderWidth: 2,
						borderStyle: 'dashed',
						borderColor: uploads.photos.some((p) => p.status === 'error') ? c.danger : raw.mapRowBorder,
						paddingHorizontal: 14,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
					}}
				>
					{uploads.photos.length ? (
						uploads.photos.map((photo) => (
							<Pressable
								key={photo.key}
								onPress={() => (photo.status === 'error' ? uploads.retry(photo.key) : uploads.remove(photo.key))}
								style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden' }}
							>
								<Image source={{ uri: photo.uri }} style={{ flex: 1, opacity: photo.status === 'done' ? 1 : 0.5 }} />
							</Pressable>
						))
					) : (
						<PhotoIcon size={20} color={c.ink} />
					)}
					<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>
						{uploads.photos.length ? `Фото · ${uploads.photos.length} из 3` : 'Фото детали'}{' '}
						<Text style={{ fontFamily: fontFamily(400), color: c.muted }}>
							{uploads.photos.some((p) => p.status === 'error') ? '· не загрузилось, нажмите на фото' : '· необязательно'}
						</Text>
					</Text>
				</Pressable>

				{sectionLabel('Кому отправить')}
				<Segmented
					items={TARGETS.map((t) => t.label)}
					value={TARGETS.findIndex((t) => t.value === draft.target)}
					onChange={(i) => draft.setTarget(TARGETS[i].value)}
					height={44}
					itemHeight={34}
					padding={3}
					gap={0}
					activeWeight={600}
					inactiveColor={c.muted}
					borderColor={c.border}
				/>

				{draft.target !== 'MARKET' ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{draft.target === 'ROWS'
							? draft.rows.map((row) => chip(row.label, () => draft.toggleRow(row), row.id))
							: draft.containers.map((box) => chip(`${box.rowLabel} · ${box.number}`, () => draft.toggleContainer(box), box.id))}
						<Pressable
							onPress={() => router.push({ pathname: '/search-target', params: { carId: carId ? String(carId) : '' } })}
							style={{
								height: 36,
								paddingHorizontal: 14,
								borderRadius: 18,
								borderWidth: 2,
								borderStyle: 'dashed',
								borderColor: raw.mapRowBorder,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 6,
							}}
						>
							<MarketIcon size={16} color={c.brandStrong} strokeWidth={2.2} />
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Выбрать на карте</Text>
						</Pressable>
					</View>
				) : null}

				{sectionLabel('Сколько ждать ответы')}
				<DurationPicker value={draft.duration} onChange={draft.setDuration} />

				<View
					style={{
						borderRadius: 12,
						backgroundColor: c.brandTint,
						paddingVertical: 10,
						paddingHorizontal: 12,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<LocateIcon size={18} color={c.brandStrong} />
					<Text style={{ flex: 1, fontSize: 14, lineHeight: 18.9, fontFamily: fontFamily(400), color: '#1D2B53' }}>
						{!audienceReady ? (
							draft.target === 'ROWS' ? 'Выберите ряды на карте' : 'Выберите контейнеры на карте'
						) : recipients === undefined ? (
							' '
						) : (
							<>
								Запрос получат{' '}
								<Text style={{ fontFamily: fontFamily(700) }}>
									{recipients} {plural(recipients, ['продавец', 'продавца', 'продавцов'])}
								</Text>
								{estimate.data?.brand ? ` по ${estimate.data.brand}` : ''} {where}. Ответы принимаются{' '}
								<Text style={{ fontFamily: fontFamily(700) }}>{duration.words}</Text>.
							</>
						)}
					</Text>
				</View>
			</ScrollView>

			<View
				style={{
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 28 + insets.bottom,
					backgroundColor: c.card,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					gap: 10,
				}}
			>
				{create.error ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{create.error.message}</Text>
				) : null}
				<Button
					label="Отправить запрос"
					height={56}
					fontSize={17}
					disabled={!carId || text.length < 3 || uploads.uploading || !audienceReady || recipients === 0}
					loading={create.isPending}
					onPress={send}
				/>
			</View>
		</View>
	)
}
