import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import {
	BigButton,
	Caps,
	CameraV23Icon,
	CrossIcon,
	MicV23Icon,
	PaperPlaneIcon,
	PassportIcon,
	PlusThinIcon,
	TopBar,
} from '@/components/buyer-v23'
import { VoicePlayer, useVoiceNote, voiceClock } from '@/components/voice'
import { fontFamily, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { ApiError } from '@/lib/api'
import { useAddCar, useCars } from '@/api/garage'
import { usePhotoUploads } from '@/api/media'
import { useReadTechPassport } from '@/api/ocr'
import { useCreateRequest, useRecipientsEstimate } from '@/api/requests'

/** 04 «Найти запчасть»: car (or a photo of the tech passport), photo + voice + text, ask the whole market. */
export default function SearchPartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ text?: string; carId?: string }>()
	const cars = useCars()
	const [pickedCarId, setCarId] = useState<number | null>(params.carId ? Number(params.carId) : null)
	const [text, setText] = useState(params.text ?? '')
	const uploads = usePhotoUploads('REQUEST', 3)
	// What the buyer said goes into the field if it's still empty.
	const voice = useVoiceNote('REQUEST', (result) => {
		if (result.voice.transcript) setText((current) => (current.trim() ? current : result.voice.transcript ?? ''))
	})
	const passport = useReadTechPassport()
	const addCar = useAddCar()
	const create = useCreateRequest()

	const carList = cars.data ?? []
	const carId = pickedCarId ?? carList.find((car) => car.isPrimary)?.id ?? carList[0]?.id
	const estimate = useRecipientsEstimate({ carId, target: 'MARKET' }, Boolean(carId))
	const typed = text.trim()
	const voiceId = voice.result?.voice.id
	const hasPart = typed.length >= 3 || uploads.mediaIds.length > 0 || Boolean(voiceId)
	const busy = uploads.uploading || voice.uploading || voice.recording

	/** Tech passport photo → car in the garage; model not read → the manual picker with what was read. */
	const scanPassport = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync()
		const result = permission.granted
			? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
			: await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })
		if (result.canceled) return
		passport.mutate(result.assets[0].uri, {
			onSuccess: (read) => {
				if (read.model && read.year) {
					addCar.mutate(
						{
							modelId: read.model.id,
							year: read.year,
							vin: read.vin ?? undefined,
							engineVolume: read.engineVolume ?? undefined,
							fuel: read.fuel ?? undefined,
							fromTechPassport: true,
						},
						{ onSuccess: (car) => setCarId(car.id) }
					)
				} else {
					router.push({
						pathname: '/garage-add',
						params: {
							brand: read.brand ? JSON.stringify(read.brand) : undefined,
							year: read.year ? String(read.year) : undefined,
							vin: read.vin ?? undefined,
							engineVolume: read.engineVolume ? String(read.engineVolume) : undefined,
							fuel: read.fuel ?? undefined,
						},
					})
				}
			},
			onError: () => router.push('/garage-add'),
		})
	}

	const send = () =>
		carId &&
		create.mutate(
			{ carId, text: typed || undefined, mediaIds: uploads.mediaIds, voiceMediaId: voiceId },
			{ onSuccess: (request) => router.replace({ pathname: '/request', params: { id: String(request.id) } }) }
		)

	const photo = uploads.photos[0]
	const recipients = estimate.data?.recipients
	const brand = estimate.data?.brand ?? carList.find((car) => car.id === carId)?.brand.name
	const passportBusy = passport.isPending || addCar.isPending
	const error = create.error ?? (passport.error instanceof ApiError && passport.error.code !== 'OCR_UNAVAILABLE' ? passport.error : null)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar title="Найти запчасть" big onClose={() => router.back()} />

			<ScrollView
				contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<QueryErrorBanner error={cars.error} onRetry={() => cars.refetch()} />

				<Caps>Для какой машины</Caps>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
					{carList.map((car) => {
						const active = car.id === carId
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
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>{car.label}</Text>
							</Pressable>
						)
					})}
					<Pressable
						onPress={scanPassport}
						disabled={passportBusy}
						style={{
							height: 40,
							paddingHorizontal: 14,
							borderRadius: 20,
							borderWidth: 2,
							borderStyle: 'dashed',
							borderColor: '#B8C3D3',
							flexDirection: 'row',
							alignItems: 'center',
							gap: 6,
						}}
					>
						{passportBusy ? <ActivityIndicator size="small" color={c.brandStrong} /> : <PassportIcon size={18} color={c.brandStrong} />}
						<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>
							{passportBusy ? 'Читаем техпаспорт…' : 'Фото техпаспорта'}
						</Text>
					</Pressable>
				</ScrollView>

				<View style={{ height: 2 }} />
				<Caps>Что нужно</Caps>
				<View style={{ flexDirection: 'row', gap: 10 }}>
					{photo ? (
						<View style={{ flex: 1, height: 132, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E1E6ED' }}>
							<Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
							{photo.status === 'uploading' ? (
								<View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.4)' }}>
									<ActivityIndicator color={c.brand} />
								</View>
							) : null}
							<Pressable
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
								<CrossIcon size={14} color="#FFFFFF" strokeWidth={2.6} />
							</Pressable>
							{uploads.photos.length > 1 ? (
								<View style={{ position: 'absolute', top: 8, left: 8, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: 'rgba(32,31,29,0.6)', justifyContent: 'center' }}>
									<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{uploads.photos.length} фото</Text>
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
										backgroundColor: 'rgba(255,255,255,0.94)',
										flexDirection: 'row',
										alignItems: 'center',
										gap: 4,
									}}
								>
									<PlusThinIcon size={12} color={c.ink} strokeWidth={2.8} />
									<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: c.ink }}>Ещё фото</Text>
								</Pressable>
							) : null}
						</View>
					) : (
						<DashedTile onPress={() => uploads.pick('camera')} onLongPress={() => uploads.pick('library')}>
							<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
								<CameraV23Icon size={26} color={c.brandStrong} />
							</View>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>Сфотать деталь</Text>
						</DashedTile>
					)}

					{voice.result ? (
						<View style={{ flex: 1, height: 132, borderRadius: 18, backgroundColor: c.card, padding: 12, justifyContent: 'space-between' }}>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Голосом</Text>
							<VoicePlayer voice={voice.result.voice} height={40} />
							<Text onPress={voice.reset} style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>
								Перезаписать
							</Text>
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
								{voice.uploading ? <ActivityIndicator color="#FFFFFF" /> : <MicV23Icon size={26} color="#FFFFFF" />}
							</View>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>
								{voice.uploading ? 'Слушаем…' : voice.recording ? `Готово · ${voiceClock(voice.seconds)}` : 'Сказать голосом'}
							</Text>
						</DashedTile>
					)}
				</View>
				{voice.error ? <Text style={{ fontSize: 13, fontFamily: fontFamily(500), color: c.danger }}>{voice.error}</Text> : null}

				<TextInput
					value={text}
					onChangeText={setText}
					maxLength={200}
					placeholder="Например: стойки передние, пара"
					placeholderTextColor={c.muted}
					style={{
						height: 52,
						borderRadius: 14,
						borderWidth: 2,
						borderColor: c.border,
						backgroundColor: c.card,
						paddingHorizontal: 14,
						fontSize: 16,
						fontFamily: fontFamily(400),
						color: c.ink,
					}}
				/>
				<Text style={{ fontSize: 13.5, lineHeight: 17.5, fontFamily: fontFamily(400), color: c.muted }}>
					Не знаете названия? Просто сфотайте деталь или скажите своими словами.
				</Text>

				{brand ? (
					<View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, backgroundColor: c.brandTint, paddingVertical: 12, paddingHorizontal: 14 }}>
						<PaperPlaneIcon size={18} color={c.brandStrong} strokeWidth={2.2} />
						<Text style={{ flex: 1, fontSize: 14, lineHeight: 19.6, fontFamily: fontFamily(400), color: '#1D2B53' }}>
							Спросим <Text style={{ fontFamily: fontFamily(700) }}>всех продавцов {brand}</Text> на рынке
							{recipients != null ? ` — ${recipients} ${plural(recipients, ['контейнер', 'контейнера', 'контейнеров'])}` : ''}. Обычно
							отвечают за 5–10 минут.
						</Text>
					</View>
				) : null}

				{error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
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
					label="Спросить весь рынок"
					height={58}
					icon={<PaperPlaneIcon size={20} color="#FFFFFF" />}
					disabled={!carId || !hasPart || busy}
					loading={create.isPending}
					onPress={send}
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
				borderColor: '#B8C3D3',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 10,
			}}
		>
			{children}
		</Pressable>
	)
}
