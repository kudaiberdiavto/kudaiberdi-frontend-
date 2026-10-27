import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { getThumbnailAsync } from 'expo-video-thumbnails'
import { BigButton, TickIcon, TopBar, priceDigits } from '@/components/buyer-v23'
import { BottomSheet, QueryErrorBanner } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { CloseIcon, GalleryIcon } from '@/components/icons'
import { LoopVideo, TruckTile } from '@/components/video-v23'
import { voiceClock } from '@/components/voice'
import { fontFamily, raw, useColors } from '@/theme'
import { uploadPartVideo } from '@/lib/api'
import { useBrands, useModels } from '@/api/directory'
import { usePublishPart, useSavePart } from '@/api/parts'
import type { Brand, PartVideoUpload } from '@/api/types'

const MAX_SEC = 30

interface Recorded {
	uri: string
	mimeType: string
	durationSec: number
}

interface PickedModel {
	modelId: number
	brandId: number
	label: string
}

/**
 * Seller «Выложить видео»: film the part for 10–15 s and say what it is and the price — the server fills the form
 * from the voice («✓ Заполнили из голоса»). The video becomes a part of the catalog: the feed, the home screen and
 * the search show it to buyers with these cars. «Отправлю в регионы» — Ылдам Экспресс picks it up from the box.
 */
export default function SellerVideoScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const save = useSavePart()
	const publish = usePublishPart()

	const [recording, setRecording] = useState(false)
	const [video, setVideo] = useState<Recorded | null>(null)
	const [progress, setProgress] = useState<number | null>(null)
	const [uploaded, setUploaded] = useState<PartVideoUpload | null>(null)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [title, setTitle] = useState('')
	const [models, setModels] = useState<PickedModel[]>([])
	const [selected, setSelected] = useState<number[]>([])
	const [price, setPrice] = useState('')
	const [condition, setCondition] = useState<'NEW' | 'USED'>('NEW')
	const [ships, setShips] = useState(true)
	const [adding, setAdding] = useState(false)

	const draft = uploaded?.draft
	const fromVoice = Boolean(draft && (draft.title || draft.price || draft.condition || draft.models.length))
	const priceValue = Number(price.replace(/\D/g, ''))
	const ready = Boolean(uploaded && title.trim() && priceValue > 0 && selected.length)

	const upload = async (next: Recorded) => {
		setVideo(next)
		setUploaded(null)
		setUploadError(null)
		setProgress(0)
		let posterUri: string | null = null
		if (Platform.OS !== 'web') {
			try {
				posterUri = (await getThumbnailAsync(next.uri, { time: 0, quality: 0.7 })).uri
			} catch {
				posterUri = null
			}
		}
		try {
			const result = await uploadPartVideo({ ...next, posterUri }, { onProgress: setProgress })
			setUploaded(result)
			// Fill what the seller said — only the fields still empty.
			const d = result.draft
			if (d.title) setTitle((value) => value || d.title || '')
			if (d.price) setPrice((value) => value || priceDigits(d.price ?? 0))
			if (d.condition === 'NEW' || d.condition === 'USED') setCondition(d.condition)
			if (d.models.length) {
				setModels((list) => [...list, ...d.models.filter((m) => !list.some((x) => x.modelId === m.modelId))])
				setSelected((list) => [...new Set([...list, ...d.models.map((m) => m.modelId)])])
			}
		} catch (error) {
			setUploadError((error as Error).message)
		} finally {
			setProgress(null)
		}
	}

	const toggle = (modelId: number) =>
		setSelected((list) => (list.includes(modelId) ? list.filter((id) => id !== modelId) : [...list, modelId]))

	const addModel = (model: PickedModel) => {
		setModels((list) => (list.some((m) => m.modelId === model.modelId) ? list : [...list, model]))
		setSelected((list) => (list.includes(model.modelId) ? list : [...list, model.modelId]))
		setAdding(false)
	}

	// The draft created by the first tap — if publishing fails, the retry updates it instead of creating a second part.
	const draftId = useRef<number | null>(null)
	const submit = async () => {
		if (!uploaded) return
		const fitments = models.filter((m) => selected.includes(m.modelId)).map((m) => ({ brandId: m.brandId, modelId: m.modelId }))
		try {
			const part = await save.mutateAsync({
				id: draftId.current ?? undefined,
				body: {
					title: title.trim(),
					price: priceValue,
					condition,
					quantity: 1,
					fitments,
					videoMediaId: uploaded.video.id,
					shipsToRegions: ships,
				},
			})
			draftId.current = part.id
			await publish.mutateAsync(part.id)
			router.back()
		} catch {
			// shown by the error banner (save.error / publish.error)
		}
	}

	const label = { fontSize: 14.5, fontFamily: fontFamily(500), color: c.muted } as const

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar title="Выложить видео" />

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				<View style={{ flexDirection: 'row', gap: 12 }}>
					<Pressable
						onPress={() => !video && setRecording(true)}
						style={{ width: 112, height: 184, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1F2329', alignItems: 'center', justifyContent: 'center' }}
					>
						{video ? (
							<LoopVideo key={video.uri} url={video.uri} playing style={{ position: 'absolute', width: '100%', height: '100%' }} />
						) : (
							<View style={{ alignItems: 'center', gap: 8 }}>
								<View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
									<View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#E5484D' }} />
								</View>
								<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Снять</Text>
							</View>
						)}
						{video ? (
							<View
								style={{
									position: 'absolute',
									top: 8,
									left: 8,
									height: 20,
									paddingHorizontal: 6,
									borderRadius: 10,
									backgroundColor: '#E5484D',
									flexDirection: 'row',
									alignItems: 'center',
									gap: 4,
								}}
							>
								<View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
								<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{voiceClock(video.durationSec)}</Text>
							</View>
						) : null}
						{video ? (
							<Pressable
								onPress={() => setRecording(true)}
								style={{
									position: 'absolute',
									left: 6,
									right: 6,
									bottom: 6,
									height: 32,
									borderRadius: 9,
									backgroundColor: 'rgba(60,60,60,0.85)',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Переснять</Text>
							</Pressable>
						) : null}
					</Pressable>

					<View style={{ flex: 1, gap: 8 }}>
						<Text style={{ fontSize: 16.5, lineHeight: 22, fontFamily: fontFamily(700), color: c.ink }}>
							Снимите деталь 10–15 секунд и скажите вслух, что это и сколько стоит
						</Text>
						<Text style={{ fontSize: 14.5, lineHeight: 19, fontFamily: fontFamily(400), color: c.muted }}>
							Например: «Стойки KYB на Камри пятьдесят, новые, пара — три двести»
						</Text>
						{progress !== null ? (
							<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: c.brandStrong }}>Загружаем… {Math.round(progress * 100)}%</Text>
						) : fromVoice ? (
							<View
								style={{
									alignSelf: 'flex-start',
									height: 26,
									paddingHorizontal: 9,
									borderRadius: 13,
									backgroundColor: c.brandTint,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 5,
								}}
							>
								<TickIcon size={13} color={c.brandStrong} />
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Заполнили из голоса</Text>
							</View>
						) : null}
						{uploadError && video ? (
							<Text onPress={() => upload(video)} style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: c.danger }}>
								Не загрузилось · повторить
							</Text>
						) : null}
					</View>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 8 }}>
					<Text style={label}>Что это</Text>
					<TextInput
						value={title}
						onChangeText={setTitle}
						placeholder="Стойки передние KYB, пара"
						placeholderTextColor="#8C8888"
						maxLength={120}
						style={{
							height: 48,
							borderRadius: 12,
							borderWidth: 1.5,
							borderColor: c.border,
							paddingHorizontal: 12,
							fontSize: 17.5,
							fontFamily: fontFamily(600),
							color: c.ink,
						}}
					/>
					<Text style={[label, { paddingTop: 4 }]}>На какие машины</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
						{models.map((model) => {
							const active = selected.includes(model.modelId)
							return (
								<Pressable
									key={model.modelId}
									onPress={() => toggle(model.modelId)}
									style={{
										height: 34,
										paddingHorizontal: 12,
										borderRadius: 17,
										backgroundColor: active ? c.brand : c.card,
										borderWidth: active ? 0 : 1.5,
										borderColor: c.border,
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.ink }}>{model.label}</Text>
								</Pressable>
							)
						})}
						<Pressable
							onPress={() => setAdding(true)}
							style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B8B4B4', justifyContent: 'center' }}
						>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.ink }}>+ ещё</Text>
						</Pressable>
					</View>
					<View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
						<View style={{ flex: 1, gap: 6 }}>
							<Text style={label}>Цена, сом</Text>
							<TextInput
								value={price}
								onChangeText={(text) => {
									const digits = text.replace(/\D/g, '')
									setPrice(digits ? priceDigits(Number(digits)) : '')
								}}
								keyboardType="number-pad"
								placeholder="3 200"
								placeholderTextColor="#8C8888"
								style={{
									height: 48,
									borderRadius: 12,
									borderWidth: 1.5,
									borderColor: c.border,
									paddingHorizontal: 12,
									fontSize: 18.5,
									fontFamily: fontFamily(700),
									color: c.ink,
								}}
							/>
						</View>
						<View style={{ flex: 1, gap: 6 }}>
							<Text style={label}>Состояние</Text>
							<View style={{ height: 48, borderRadius: 12, backgroundColor: raw.fill, padding: 4, flexDirection: 'row' }}>
								{(['NEW', 'USED'] as const).map((value) => (
									<Pressable
										key={value}
										onPress={() => setCondition(value)}
										style={{ flex: 1, borderRadius: 9, backgroundColor: condition === value ? c.card : 'transparent', alignItems: 'center', justifyContent: 'center' }}
									>
										<Text style={{ fontSize: 16, fontFamily: fontFamily(condition === value ? 700 : 600), color: condition === value ? c.ink : c.muted }}>
											{value === 'NEW' ? 'Новая' : 'Б/у'}
										</Text>
									</Pressable>
								))}
							</View>
						</View>
					</View>
				</View>

				<Pressable onPress={() => setShips(!ships)} style={{ borderRadius: 16, backgroundColor: c.card, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
					<TruckTile />
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.ink }}>Отправлю в регионы</Text>
						<Text style={{ fontSize: 14.5, lineHeight: 18.5, fontFamily: fontFamily(400), color: c.muted }}>Курьер Ылдам Экспресс заберёт из контейнера</Text>
					</View>
					<View
						style={{
							width: 24,
							height: 24,
							borderRadius: 6,
							borderWidth: ships ? 0 : 2,
							borderColor: '#B8B4B4',
							backgroundColor: ships ? c.success : 'transparent',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{ships ? <TickIcon size={15} color="#FFFFFF" /> : null}
					</View>
				</Pressable>

				<Text style={{ fontSize: 14.5, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center', paddingHorizontal: 12 }}>
					Видео увидят покупатели с этими машинами — в ленте и на главной
				</Text>

				<QueryErrorBanner error={save.error ?? publish.error} />
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
				<BigButton label="Выложить в ленту" tone="green" onPress={submit} disabled={!ready} loading={save.isPending || publish.isPending} />
			</View>

			<Modal visible={recording} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setRecording(false)}>
				<Recorder
					onClose={() => setRecording(false)}
					onDone={(next) => {
						setRecording(false)
						upload(next)
					}}
				/>
			</Modal>

			{adding ? <ModelPicker onClose={() => setAdding(false)} onPick={addModel} /> : null}
		</KeyboardAvoidingView>
	)
}

/** Full-screen camera: ● to start / stop (up to 30 s), or a video from the gallery. */
function Recorder({ onClose, onDone }: { onClose: () => void; onDone: (video: Recorded) => void }) {
	const insets = useSafeAreaInsets()
	const camera = useRef<CameraView>(null)
	const [cameraPermission, requestCamera] = useCameraPermissions()
	const [micPermission, requestMic] = useMicrophonePermissions()
	const [active, setActive] = useState(false)
	const [seconds, setSeconds] = useState(0)
	const started = useRef(0)
	// Closed while recording (✕ or Android back) — the recording is thrown away, not uploaded.
	const cancelled = useRef(false)
	useEffect(
		() => () => {
			cancelled.current = true
		},
		[]
	)
	const close = () => {
		cancelled.current = true
		if (active) camera.current?.stopRecording()
		onClose()
	}

	useEffect(() => {
		if (!active) return
		const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started.current) / 1000)), 250)
		return () => clearInterval(timer)
	}, [active])

	const granted = cameraPermission?.granted && micPermission?.granted

	const record = async () => {
		if (!camera.current) return
		if (active) {
			camera.current.stopRecording()
			return
		}
		started.current = Date.now()
		setSeconds(0)
		setActive(true)
		try {
			const result = await camera.current.recordAsync({ maxDuration: MAX_SEC })
			const durationSec = Math.max(1, Math.round((Date.now() - started.current) / 1000))
			if (result?.uri && !cancelled.current) onDone({ uri: result.uri, mimeType: Platform.OS === 'ios' ? 'video/quicktime' : 'video/mp4', durationSec })
		} finally {
			setActive(false)
		}
	}

	const fromGallery = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: MAX_SEC, quality: 1 })
		if (result.canceled) return
		const asset = result.assets[0]
		// expo-image-picker: milliseconds on iOS / Android, seconds on web.
		const raw = asset.duration && Number.isFinite(asset.duration) ? asset.duration : 0
		const durationSec = Math.max(1, Math.round(Platform.OS === 'web' ? raw : raw / 1000))
		onDone({ uri: asset.uri, mimeType: asset.mimeType ?? 'video/mp4', durationSec })
	}

	return (
		<View style={{ flex: 1, backgroundColor: '#000000' }}>
			{granted ? (
				<CameraView ref={camera} style={{ flex: 1 }} mode="video" facing="back" />
			) : (
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
					<Text style={{ fontSize: 17.5, lineHeight: 24, fontFamily: fontFamily(500), color: '#FFFFFF', textAlign: 'center' }}>
						Разрешите камеру и микрофон — снимите деталь и скажите, что это и сколько стоит
					</Text>
					<BigButton
						label="Разрешить"
						onPress={async () => {
							await requestCamera()
							await requestMic()
						}}
						style={{ alignSelf: 'stretch' }}
					/>
				</View>
			)}

			<Pressable onPress={close} hitSlop={12} style={{ position: 'absolute', top: insets.top + 12, left: 16 }}>
				<CloseIcon size={28} color="#FFFFFF" />
			</Pressable>
			{active ? (
				<View
					style={{
						position: 'absolute',
						top: insets.top + 12,
						alignSelf: 'center',
						height: 28,
						paddingHorizontal: 10,
						borderRadius: 14,
						backgroundColor: '#E5484D',
						flexDirection: 'row',
						alignItems: 'center',
						gap: 6,
					}}
				>
					<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{voiceClock(seconds)}</Text>
				</View>
			) : null}

			<View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
				<Pressable onPress={fromGallery} disabled={active} style={{ position: 'absolute', left: 32, opacity: active ? 0.3 : 1 }}>
					<GalleryIcon size={30} color="#FFFFFF" />
				</Pressable>
				<Pressable
					onPress={record}
					disabled={!granted}
					style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
				>
					<View style={{ width: active ? 30 : 58, height: active ? 30 : 58, borderRadius: active ? 8 : 29, backgroundColor: '#E5484D' }} />
				</Pressable>
			</View>
			<Text style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 112, fontSize: 15.5, lineHeight: 21, fontFamily: fontFamily(500), color: '#FFFFFF', textAlign: 'center' }}>
				{active ? 'Скажите, что это и сколько стоит' : 'Снимите деталь 10–15 секунд'}
			</Text>
		</View>
	)
}

/** «+ ещё»: a brand, then its model («Camry 50»). */
function ModelPicker({ onClose, onPick }: { onClose: () => void; onPick: (model: PickedModel) => void }) {
	const c = useColors()
	const [q, setQ] = useState('')
	const [brand, setBrand] = useState<Brand | null>(null)
	const brands = useBrands(q.trim() ? { q: q.trim() } : { popular: true })
	const models = useModels(brand?.id)

	return (
		<BottomSheet
			onClose={onClose}
			header={
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Text style={{ flex: 1, fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>{brand ? brand.name : 'Какая марка'}</Text>
					{brand ? (
						<Text onPress={() => setBrand(null)} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
							Другая марка
						</Text>
					) : null}
				</View>
			}
		>
			{brand ? (
				<View style={{ gap: 8 }}>
					{(models.data ?? []).map((model) => (
						<Pressable
							key={model.id}
							onPress={() => onPick({ modelId: model.id, brandId: brand.id, label: model.label })}
							style={{ height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: c.hairline, paddingHorizontal: 14, justifyContent: 'center' }}
						>
							<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>{model.label}</Text>
						</Pressable>
					))}
				</View>
			) : (
				<View style={{ gap: 8 }}>
					<TextInput
						value={q}
						onChangeText={setQ}
						placeholder="Марка"
						placeholderTextColor="#8C8888"
						style={{ height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: 12, fontSize: 17.5, fontFamily: fontFamily(500), color: c.ink }}
					/>
					{(brands.data ?? []).map((item) => (
						<Pressable
							key={item.id}
							onPress={() => setBrand(item)}
							style={{ height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: c.hairline, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
						>
							<BrandLogo brand={item} size={30} />
							<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>{item.name}</Text>
						</Pressable>
					))}
				</View>
			)}
		</BottomSheet>
	)
}
