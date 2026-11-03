import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { askForPushAt } from '@/lib/push'
import { useConfirmLeave } from '@/lib/use-confirm-leave'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { QueryErrorBanner, ScreenHeader } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { BigButton, Caps, CameraV23Icon, CrossIcon, MicV23Icon, PaperPlaneIcon, PlusThinIcon } from '@/components/buyer-v23'
import { VoicePlayer, useVoiceNote, voiceClock } from '@/components/voice'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { useCars } from '@/api/garage'
import { usePhotoUploads } from '@/api/media'
import { useCreateRequest, useRecipientsEstimate } from '@/api/requests'
import { useClientCar } from '@/store/useClientCar'
import { useSession } from '@/store/useSession'
import { t } from '@/i18n'

/**
 * 04 «Найти запчасть»: car, photo + voice + text, the request goes to sellers of the car's brand.
 * «Машина клиента» — a car for this request only (masters and СТО have no car of their own).
 */
export default function SearchPartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ text?: string; carId?: string }>()
	const cars = useCars()
	const clientCar = useClientCar((s) => s.car)
	const pickedCarId = useClientCar((s) => s.selected) ?? (params.carId ? Number(params.carId) : null)
	const setCarId = useClientCar((s) => s.select)
	const isMaster = useSession((s) => s.role) === 'MASTER'
	const [text, setText] = useState(params.text ?? '')
	const uploads = usePhotoUploads('REQUEST', 3)
	// What the buyer said goes into the field if it's still empty (up to 200 characters, as the server takes it).
	const voice = useVoiceNote('REQUEST', (result) => {
		const said = result.voice.transcript?.trim() ?? ''
		if (said) setText((current) => (current.trim() ? current : said.slice(0, 200)))
	})
	const create = useCreateRequest()

	// The client's car lives only while this screen is open.
	useEffect(() => () => useClientCar.getState().clear(), [])

	const carList = cars.data ?? []
	const useClient = clientCar != null && (pickedCarId === 'client' || carList.length === 0)
	const carId = useClient
		? undefined
		: ((typeof pickedCarId === 'number' ? pickedCarId : undefined) ?? carList.find((car) => car.isPrimary)?.id ?? carList[0]?.id)
	const hasCar = Boolean(carId) || useClient
	const estimate = useRecipientsEstimate(
		useClient && clientCar ? { brandId: clientCar.brand.id, target: 'MARKET' } : { carId, target: 'MARKET' },
		hasCar
	)
	const typed = text.trim()
	const voiceId = voice.result?.voice.id
	// Something to go on: text, a photo or a voice note — no minimum length.
	const hasPart = typed.length > 0 || uploads.mediaIds.length > 0 || Boolean(voiceId)
	const busy = uploads.uploading || voice.uploading || voice.recording
	const leave = useConfirmLeave(hasPart || busy)

	const send = () =>
		hasCar &&
		create.mutate(
			{
				...(useClient && clientCar ? { modelId: clientCar.model.id, year: clientCar.year } : { carId }),
				text: typed || undefined,
				mediaIds: uploads.mediaIds,
				voiceMediaId: voiceId,
			},
			{
				onSuccess: (request) => {
					leave(() => router.replace({ pathname: '/request', params: { id: String(request.id) } }))
					askForPushAt('request')
				},
			}
		)

	const photo = uploads.photos[0]
	const recipients = estimate.data?.recipients
	const brand =
		estimate.data?.brand ?? (useClient && clientCar ? clientCar.brand.name : carList.find((car) => car.id === carId)?.brand.name)
	const error = create.error
	// No car yet — the chip says «Выбрать машину»; otherwise it adds one more (a master — the client's car).
	const addCarLabel = isMaster ? t('Машина клиента') : carList.length || clientCar ? t('Добавить машину') : t('Выбрать машину')
	const pickCar = () => router.push({ pathname: '/garage-add', params: isMaster ? { once: '1' } : { select: '1' } })

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={t('Найти запчасть')} big onClose={() => router.back()} />

			<ScrollView
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<QueryErrorBanner error={cars.error} onRetry={() => cars.refetch()} />

				<Caps>{t('Для какой машины')}</Caps>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
					{carList.map((car) => {
						const active = !useClient && car.id === carId
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
									borderColor: active ? c.brand : c.card,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<BrandLogo brand={car.brand} size={28} />
								<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>{car.label}</Text>
							</Pressable>
						)
					})}
					{clientCar ? (
						<Pressable
							onPress={() => setCarId('client')}
							style={{
								height: 40,
								paddingLeft: 6,
								paddingRight: 14,
								borderRadius: 20,
								backgroundColor: useClient ? c.brandTint : c.card,
								borderWidth: 2,
								borderColor: useClient ? c.brand : c.card,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
							}}
						>
							<BrandLogo brand={clientCar.brand} size={28} />
							<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: useClient ? c.brandStrong : c.ink }}>
								{clientCar.model.label} · {clientCar.year}
							</Text>
						</Pressable>
					) : null}
					<Pressable
						onPress={pickCar}
						style={{
							height: 40,
							paddingHorizontal: 14,
							borderRadius: 20,
							borderWidth: 2,
							borderStyle: hasCar ? 'dashed' : 'solid',
							borderColor: hasCar ? c.dashedBrand : c.brand,
							backgroundColor: hasCar ? 'transparent' : c.brandTint,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 6,
						}}
					>
						<PlusThinIcon size={14} color={c.brandStrong} strokeWidth={2.6} />
						<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.brandStrong }}>{addCarLabel}</Text>
					</Pressable>
				</ScrollView>

				<View style={{ height: 2 }} />
				<Caps>{t('Что нужно')}</Caps>
				<View style={{ flexDirection: 'row', gap: 10 }}>
					{photo ? (
						<View style={{ flex: 1, height: 132, borderRadius: 18, overflow: 'hidden', backgroundColor: c.placeholder }}>
							<Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
							{photo.status === 'uploading' ? (
								<View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.4)' }}>
									<ActivityIndicator color={c.brand} />
								</View>
							) : null}
							<Pressable accessibilityRole="button" accessibilityLabel={t('Удалить фото')}
								onPress={() => uploads.remove(photo.key)}
								hitSlop={6}
								style={{
									position: 'absolute',
									top: 8,
									right: 8,
									width: 28,
									height: 28,
									borderRadius: 14,
									backgroundColor: 'rgba(32,31,29,0.6)',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<CrossIcon size={14} color={fixed.white} strokeWidth={2.6} />
							</Pressable>
							{uploads.photos.length > 1 ? (
								<View style={{ position: 'absolute', top: 8, left: 8, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(32,31,29,0.6)', justifyContent: 'center' }}>
									<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: fixed.white }}>{t('{0} фото', uploads.photos.length)}</Text>
								</View>
							) : null}
							{uploads.canAdd ? (
								<Pressable
									onPress={() => uploads.pick('camera')}
									style={{
										position: 'absolute',
										left: 8,
										bottom: 8,
										height: 26,
										paddingHorizontal: 10,
										borderRadius: 13,
										backgroundColor: c.floating,
										flexDirection: 'row',
										alignItems: 'center',
										gap: 4,
									}}
								>
									<PlusThinIcon size={12} color={c.ink} strokeWidth={2.8} />
									<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: c.ink }}>{t('Ещё фото')}</Text>
								</Pressable>
							) : null}
						</View>
					) : (
						<DashedTile onPress={() => uploads.pick('camera')} onLongPress={() => uploads.pick('library')}>
							<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
								<CameraV23Icon size={26} color={c.brandStrong} />
							</View>
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.ink }}>{t('Сфотать деталь')}</Text>
						</DashedTile>
					)}

					{voice.result ? (
						<View style={{ flex: 1, height: 132, borderRadius: 18, backgroundColor: c.card, padding: 12, justifyContent: 'space-between' }}>
							<Text style={{ fontSize: fs.md, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Голосом')}</Text>
							<VoicePlayer voice={voice.result.voice} height={40} />
							<Text onPress={voice.reset} style={{ fontSize: fs.sm, fontFamily: fontFamily(700), color: c.muted }}>{t('Перезаписать')}</Text>
						</View>
					) : (
						<DashedTile onPress={voice.recording ? voice.stop : voice.start} disabled={voice.uploading}>
							<View
								style={{
									width: 56,
									height: 56,
									borderRadius: 28,
									backgroundColor: voice.recording ? c.danger : c.brand,
									alignItems: 'center',
									justifyContent: 'center',
									shadowColor: c.brand,
									shadowOpacity: 0.3,
									shadowOffset: { width: 0, height: 6 },
									shadowRadius: 7,
									elevation: 6,
								}}
							>
								{voice.uploading ? <ActivityIndicator color={fixed.white} /> : <MicV23Icon size={26} color={fixed.white} />}
							</View>
							<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.ink }}>
								{voice.uploading ? t('Слушаем…') : voice.recording ? t('Готово · {0}', voiceClock(voice.seconds)) : t('Сказать голосом')}
							</Text>
						</DashedTile>
					)}
				</View>
				{voice.error ? <Text style={{ fontSize: fs.sm, fontFamily: fontFamily(500), color: c.danger }}>{voice.error}</Text> : null}

				<TextInput
					value={text}
					onChangeText={setText}
					maxLength={200}
					// short hint on one line; long text wraps and the field grows instead of scrolling sideways
					multiline
					placeholder={t('Или напишите: фара, стойки…')}
					placeholderTextColor={c.muted}
					style={{
						minHeight: 52,
						maxHeight: 120,
						borderRadius: 14,
						borderWidth: 2,
						borderColor: c.border,
						backgroundColor: c.card,
						paddingHorizontal: 14,
						paddingTop: 14,
						paddingBottom: 14,
						fontSize: fs.lg,
						fontFamily: fontFamily(400),
						color: c.ink,
					}}
				/>

				{brand ? (
					<View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, backgroundColor: c.brandTint, paddingVertical: 12, paddingHorizontal: 14 }}>
						<PaperPlaneIcon size={18} color={c.brandStrong} strokeWidth={2.2} />
						<Text style={{ flex: 1, fontSize: fs.md, lineHeight: 21.5, fontFamily: fontFamily(400), color: c.brandInk }}>{t('Спросим')}{' '}<Text style={{ fontFamily: fontFamily(700) }}>{t('всех продавцов {0}', brand)}</Text>
							{recipients != null ? ` — ${recipients} ${plural(recipients, [t('магазин'), t('магазина'), t('магазинов')])}` : ''}{t('. Обычно отвечают за 5–10 минут.')}
						</Text>
					</View>
				) : null}

				{error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
			</ScrollView>

			<View
				style={{
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: Math.max(insets.bottom, 28),
					backgroundColor: c.card,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
				}}
			>
				<BigButton
					label={!hasCar ? t('Сначала выберите машину') : !hasPart ? t('Опишите, что нужно') : t('Отправить запрос')}
					height={58}
					icon={hasCar && hasPart ? <PaperPlaneIcon size={20} color={fixed.white} /> : undefined}
					disabled={hasCar && (!hasPart || busy)}
					loading={create.isPending}
					onPress={hasCar ? send : pickCar}
				/>
			</View>
		</View>
	)
}

function DashedTile({
	children,
	onPress,
	onLongPress,
	disabled,
}: {
	children: ReactNode
	onPress: () => void
	onLongPress?: () => void
	disabled?: boolean
}) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			disabled={disabled}
			style={{
				flex: 1,
				height: 132,
				borderRadius: 18,
				backgroundColor: c.card,
				borderWidth: 2,
				borderStyle: 'dashed',
				borderColor: c.dashedBrand,
				alignItems: 'center',
				justifyContent: 'center',
				gap: 10,
				paddingHorizontal: 12,
			}}
		>
			{children}
		</Pressable>
	)
}
