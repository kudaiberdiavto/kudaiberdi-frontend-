import { useEffect, useState, type ReactNode } from 'react'
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
import { useClientCar } from '@/store/useClientCar'
import { useSession } from '@/store/useSession'

/**
 * 04 «Найти запчасть»: car (or a photo of the tech passport), photo + voice + text, ask the whole market.
 * «Другая машина» — a client's car for this request only (masters and СТО have no car of their own).
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
	// What the buyer said goes into the field if it's still empty — 3–200 characters, as the server takes it.
	const voice = useVoiceNote('REQUEST', (result) => {
		const said = result.voice.transcript?.trim() ?? ''
		if (said.length >= 3) setText((current) => (current.trim() ? current : said.slice(0, 200)))
	})
	const passport = useReadTechPassport()
	const addCar = useAddCar()
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
	// Typed text must be 3+ characters (the server rejects shorter); without text — a photo or a voice note.
	const hasPart = typed ? typed.length >= 3 : uploads.mediaIds.length > 0 || Boolean(voiceId)
	const busy = uploads.uploading || voice.uploading || voice.recording

	/**
	 * Tech passport photo → car in the garage (a master — the client's car, not saved);
	 * model not read → the manual picker with what was read.
	 */
	const scanPassport = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync()
		const result = permission.granted
			? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
			: await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })
		if (result.canceled) return
		passport.mutate(result.assets[0].uri, {
			onSuccess: (read) => {
				if (read.brand && read.model && read.year && isMaster) {
					useClientCar.getState().set({ brand: read.brand, model: read.model, year: read.year })
				} else if (read.model && read.year) {
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
							once: isMaster ? '1' : undefined,
							select: isMaster ? undefined : '1',
							brand: read.brand ? JSON.stringify(read.brand) : undefined,
							year: read.year ? String(read.year) : undefined,
							vin: read.vin ?? undefined,
							engineVolume: read.engineVolume ? String(read.engineVolume) : undefined,
							fuel: read.fuel ?? undefined,
						},
					})
				}
			},
			onError: () => router.push({ pathname: '/garage-add', params: isMaster ? { once: '1' } : { select: '1' } }),
		})
	}

	const send = () =>
		hasCar &&
		create.mutate(
			{
				...(useClient && clientCar ? { modelId: clientCar.model.id, year: clientCar.year } : { carId }),
				text: typed || undefined,
				mediaIds: uploads.mediaIds,
				voiceMediaId: voiceId,
			},
			{ onSuccess: (request) => router.replace({ pathname: '/request', params: { id: String(request.id) } }) }
		)

	const photo = uploads.photos[0]
	const recipients = estimate.data?.recipients
	const brand =
		estimate.data?.brand ?? (useClient && clientCar ? clientCar.brand.name : carList.find((car) => car.id === carId)?.brand.name)
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
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>{car.label}</Text>
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
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: useClient ? c.brandStrong : c.ink }}>
								{clientCar.model.label} · {clientCar.year}
							</Text>
						</Pressable>
					) : null}
					<Pressable
						onPress={() => router.push({ pathname: '/garage-add', params: { once: '1' } })}
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
						<PlusThinIcon size={14} color={c.brandStrong} strokeWidth={2.6} />
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Другая машина</Text>
					</Pressable>
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
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
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
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{uploads.photos.length} фото</Text>
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
									<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.ink }}>Ещё фото</Text>
								</Pressable>
							) : null}
						</View>
					) : (
						<DashedTile onPress={() => uploads.pick('camera')} onLongPress={() => uploads.pick('library')}>
							<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
								<CameraV23Icon size={26} color={c.brandStrong} />
							</View>
							<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.ink }}>Сфотать деталь</Text>
						</DashedTile>
					)}

					{voice.result ? (
						<View style={{ flex: 1, height: 132, borderRadius: 18, backgroundColor: c.card, padding: 12, justifyContent: 'space-between' }}>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>Голосом</Text>
							<VoicePlayer voice={voice.result.voice} height={40} />
							<Text onPress={voice.reset} style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.muted }}>
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
							<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.ink }}>
								{voice.uploading ? 'Слушаем…' : voice.recording ? `Готово · ${voiceClock(voice.seconds)}` : 'Сказать голосом'}
							</Text>
						</DashedTile>
					)}
				</View>
				{voice.error ? <Text style={{ fontSize: 14.5, fontFamily: fontFamily(500), color: c.danger }}>{voice.error}</Text> : null}

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
						fontSize: 17.5,
						fontFamily: fontFamily(400),
						color: c.ink,
					}}
				/>
				<Text style={{ fontSize: 15, lineHeight: 19, fontFamily: fontFamily(400), color: c.muted }}>
					Не знаете названия? Просто сфотайте деталь или скажите своими словами.
				</Text>

				{brand ? (
					<View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, backgroundColor: c.brandTint, paddingVertical: 12, paddingHorizontal: 14 }}>
						<PaperPlaneIcon size={18} color={c.brandStrong} strokeWidth={2.2} />
						<Text style={{ flex: 1, fontSize: 15.5, lineHeight: 21.5, fontFamily: fontFamily(400), color: '#1D2B53' }}>
							Спросим <Text style={{ fontFamily: fontFamily(700) }}>всех продавцов {brand}</Text> на рынке
							{recipients != null ? ` — ${recipients} ${plural(recipients, ['контейнер', 'контейнера', 'контейнеров'])}` : ''}. Обычно
							отвечают за 5–10 минут.
						</Text>
					</View>
				) : null}

				{error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
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
					disabled={!hasCar || !hasPart || busy}
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
