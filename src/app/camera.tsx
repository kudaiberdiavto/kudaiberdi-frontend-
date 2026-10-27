import { useRef, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Button } from '@/components/ui'
import { CloseIcon, FlashIcon, GalleryIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { usePhotoUploads } from '@/api/media'
import { useRecognizeOem } from '@/api/parts'
import { useAddShopPhoto } from '@/api/shop'
import { MAX_PART_PHOTOS, usePartDraft } from '@/store/usePartDraft'

const MODES = ['Деталь', 'Номер детали', 'Бокс'] as const
const HINTS = ['Деталь целиком, на светлом фоне', 'Наведите на номер на корпусе или бирке', 'Бокс снаружи и полки внутри']

/**
 * 25 — camera. «Деталь»: photos of the part being created [26]; «Номер детали»: OEM number
 * recognition (POST /ocr/oem); «Бокс»: photos of the place, attached to the box right away [22].
 * `from=form` — opened from 26, «Готово» returns there; otherwise it opens the form.
 */
export default function CameraScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ from?: string; mode?: string }>()
	const cameraRef = useRef<CameraView>(null)
	const [permission, requestPermission] = useCameraPermissions()
	const [mode, setMode] = useState(Number(params.mode ?? 0))
	const [torch, setTorch] = useState(false)

	const draft = usePartDraft()
	const recognize = useRecognizeOem()
	const addShopPhoto = useAddShopPhoto()
	const boxUploads = usePhotoUploads('SHOP', 8, (photo) => addShopPhoto.mutateAsync(photo.id))

	if (!permission) return null

	if (!permission.granted) {
		return (
			<View style={{ flex: 1, backgroundColor: '#0B0B0C', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
				<Text style={{ fontSize: 17.5, color: '#FFFFFF', textAlign: 'center' }}>Нужен доступ к камере, чтобы сфотографировать запчасть</Text>
				<Button label="Разрешить камеру" onPress={requestPermission} />
			</View>
		)
	}

	const take = (uri: string) => {
		if (mode === 0) draft.addPhotos([uri])
		else if (mode === 1) recognize.mutate(uri)
	}

	const capture = async () => {
		if (mode === 0 && draft.photos.length >= MAX_PART_PHOTOS) return
		if (mode === 2) {
			boxUploads.pick('camera')
			return
		}
		const photo = await cameraRef.current?.takePictureAsync({ quality: 1 })
		if (photo) take(photo.uri)
	}

	const fromGallery = async () => {
		if (mode === 2) return boxUploads.pick('library')
		const left = mode === 0 ? MAX_PART_PHOTOS - draft.photos.length : 1
		if (left <= 0) return
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsMultipleSelection: left > 1,
			selectionLimit: left,
		})
		if (result.canceled) return
		if (mode === 0) draft.addPhotos(result.assets.map((a) => a.uri))
		else recognize.mutate(result.assets[0].uri)
	}

	const done = () => {
		if (params.from === 'form' || mode === 2) router.back()
		else router.replace('/new-part')
	}

	const title =
		mode === 0
			? `Фото запчасти · ${draft.photos.length} из ${MAX_PART_PHOTOS}`
			: mode === 1
				? 'Номер детали'
				: `Фото места${boxUploads.photos.length ? ` · ${boxUploads.photos.length}` : ''}`
	const candidates = recognize.data?.candidates ?? []
	const recentShots = draft.photos.slice(-2)

	return (
		<View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
			<CameraView ref={cameraRef} style={{ flex: 1 }} enableTorch={torch} />

			<View
				style={{
					position: 'absolute',
					left: 16,
					right: 16,
					top: insets.top + 9,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<Pressable
					onPress={() => router.back()}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<CloseIcon size={20} color="#FFFFFF" />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{title}</Text>
				<Pressable
					onPress={() => setTorch((v) => !v)}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<FlashIcon size={20} color="#FFD54A" />
				</Pressable>
			</View>

			<View pointerEvents="none" style={{ position: 'absolute', left: 30, top: 150, width: 330, height: 330 }}>
				{(
					[
						{ left: 0, top: 0, rotate: '0deg' },
						{ right: 0, top: 0, rotate: '90deg' },
						{ right: 0, bottom: 0, rotate: '180deg' },
						{ left: 0, bottom: 0, rotate: '270deg' },
					] as const
				).map(({ rotate, ...position }, i) => (
					<View
						key={i}
						style={{
							position: 'absolute',
							width: 26,
							height: 26,
							borderColor: '#FFFFFF',
							borderTopWidth: 4,
							borderLeftWidth: 4,
							borderTopLeftRadius: 6,
							transform: [{ rotate }],
							...position,
						}}
					/>
				))}
			</View>

			{mode === 1 && (recognize.isPending || recognize.data || recognize.error) ? (
				<View style={{ position: 'absolute', left: 16, right: 16, top: 491, gap: 8 }}>
					<View style={{ alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)' }}>
						<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: '#FFFFFF' }}>
							{recognize.isPending
								? 'Распознаём номер…'
								: recognize.error
									? recognize.error.message
									: candidates.length
										? 'Нажмите на верный номер'
										: 'Номер не нашли — попробуйте ближе и ровнее'}
						</Text>
					</View>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
						{candidates.map((candidate) => {
							const active = draft.oemNumber === candidate.normalized
							return (
								<Pressable
									key={candidate.normalized}
									onPress={() => draft.set({ oemNumber: candidate.normalized })}
									style={{
										paddingHorizontal: 14,
										paddingVertical: 8,
										borderRadius: 14,
										backgroundColor: active ? '#FFD54A' : 'rgba(255,255,255,0.92)',
										gap: 2,
									}}
								>
									<Text style={{ fontSize: 16.5, fontFamily: fontFamily(800), color: '#201F1D' }}>{candidate.oem}</Text>
									<Text style={{ fontSize: 12, fontFamily: fontFamily(600), color: '#605D5D' }}>
										{candidate.partsFound
											? `есть у ${candidate.partsFound} ${plural(candidate.partsFound, ['продавца', 'продавцов', 'продавцов'])}`
											: 'новый номер'}
									</Text>
								</Pressable>
							)
						})}
					</ScrollView>
				</View>
			) : (
				<View
					style={{
						position: 'absolute',
						alignSelf: 'center',
						top: 501,
						height: 36,
						paddingHorizontal: 14,
						borderRadius: 18,
						backgroundColor: 'rgba(0,0,0,0.55)',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: '#FFFFFF' }}>
						{mode === 1 && draft.oemNumber ? `Номер: ${draft.oemNumber}` : HINTS[mode]}
					</Text>
				</View>
			)}

			{mode === 0 ? (
				<View style={{ position: 'absolute', left: 16, right: 16, top: 556, flexDirection: 'row', gap: 8 }}>
					{recentShots.map((shot) => (
						<Pressable
							key={shot.key}
							onPress={() => shot.status === 'error' && draft.retryPhoto(shot.key)}
							style={{
								width: 56,
								height: 56,
								borderRadius: 10,
								overflow: 'hidden',
								borderWidth: shot.status === 'error' ? 2 : 0,
								borderColor: c.danger,
							}}
						>
							<Image source={{ uri: shot.uri }} style={{ flex: 1, opacity: shot.status === 'done' ? 1 : 0.5 }} />
							{shot.status === 'uploading' ? (
								<View
									style={{
										position: 'absolute',
										left: 0,
										bottom: 0,
										height: 3,
										width: `${Math.round(shot.progress * 100)}%`,
										backgroundColor: '#FFFFFF',
									}}
								/>
							) : null}
						</Pressable>
					))}
					{draft.photos.length < MAX_PART_PHOTOS ? (
						<View style={{ width: 60, height: 60, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' }} />
					) : null}
				</View>
			) : null}

			<View style={{ position: 'absolute', left: 16, right: 16, top: 637, flexDirection: 'row', justifyContent: 'space-between' }}>
				{MODES.map((label, i) => (
					<Pressable key={label} onPress={() => setMode(i)}>
						<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: mode === i ? '#FFD54A' : 'rgba(255,255,255,0.55)' }}>
							{label}
						</Text>
					</Pressable>
				))}
			</View>

			<View
				style={{
					position: 'absolute',
					left: 16,
					right: 16,
					bottom: insets.bottom + 24,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Pressable
					onPress={fromGallery}
					style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<GalleryIcon size={24} color="#FFFFFF" />
				</Pressable>

				<Pressable
					onPress={capture}
					disabled={recognize.isPending}
					style={{
						width: 80,
						height: 80,
						borderRadius: 40,
						borderWidth: 5,
						borderColor: '#FFFFFF',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: recognize.isPending ? 0.5 : 1,
					}}
				>
					<View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' }} />
				</Pressable>

				<Pressable
					onPress={done}
					style={{
						height: 52,
						paddingHorizontal: 18,
						borderRadius: 26,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Готово</Text>
				</Pressable>
			</View>
		</View>
	)
}
