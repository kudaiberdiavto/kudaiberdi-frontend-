import { useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Button } from '@/components/ui'
import { CloseIcon, FlashIcon, GalleryIcon } from '@/components/icons'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { plural } from '@/lib/format'
import { usePhotoUploads } from '@/api/media'
import { useRecognizeOem } from '@/api/parts'
import { useAddShopPhoto } from '@/api/shop'
import { MAX_PART_PHOTOS, usePartDraft } from '@/store/usePartDraft'
import { t } from '@/i18n'

/**
 * 25 — camera, no mode tabs: `mode` 0 (default) — photos of the part being created [26]; 1 — OEM number recognition
 * (POST /ocr/oem); 2 — photos of the place, attached to the box right away [22].
 * `from=form` — opened from 26, «Готово» returns there; otherwise it opens the form.
 */
export default function CameraScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const params = useLocalSearchParams<{ from?: string; mode?: string }>()
	const cameraRef = useRef<CameraView>(null)
	const [permission, requestPermission] = useCameraPermissions()
	const mode = Number(params.mode ?? 0)
	const [torch, setTorch] = useState(false)
	// The shutter waits for the camera: a shot before onCameraReady throws «Camera is not ready yet».
	const [ready, setReady] = useState(false)

	const draft = usePartDraft()
	const recognize = useRecognizeOem()
	const addShopPhoto = useAddShopPhoto()
	const boxUploads = usePhotoUploads('SHOP', 8, (photo) => addShopPhoto.mutateAsync(photo.id))

	if (!permission) return null

	if (!permission.granted) {
		return (
			<View style={{ flex: 1, backgroundColor: fixed.camera, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
				<Text style={{ fontSize: fs.lg, color: fixed.white, textAlign: 'center' }}>{t('Нужен доступ к камере, чтобы сфотографировать запчасть')}</Text>
				<Button label={t('Разрешить камеру')} onPress={requestPermission} />
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
		if (!ready) return
		try {
			const photo = await cameraRef.current?.takePictureAsync({ quality: 1 })
			if (photo) take(photo.uri)
		} catch {
			// the camera went away mid-shot (app in background, screen closed) — nothing to keep
		}
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
			? t('Фото запчасти · {0} из {1}', draft.photos.length, MAX_PART_PHOTOS)
			: mode === 1
				? t('Номер детали')
				: t('Фото места') + (boxUploads.photos.length ? ` · ${boxUploads.photos.length}` : '')
	const candidates = recognize.data?.candidates ?? []
	const recentShots = draft.photos.slice(-2)

	return (
		<View style={{ flex: 1, backgroundColor: fixed.camera }}>
			<CameraView ref={cameraRef} style={{ flex: 1 }} enableTorch={torch} onCameraReady={() => setReady(true)} />

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
				<Pressable accessibilityRole="button" accessibilityLabel={t('Закрыть')}
					onPress={() => router.back()}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<CloseIcon size={20} color={fixed.white} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{title}</Text>
				<Pressable accessibilityRole="button" accessibilityLabel={t('Вспышка')}
					onPress={() => setTorch((v) => !v)}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<FlashIcon size={20} color={fixed.flash} />
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
							borderColor: fixed.white,
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
						<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: fixed.white }}>
							{recognize.isPending
								? t('Распознаём номер…')
								: recognize.error
									? recognize.error.message
									: candidates.length
										? t('Нажмите на верный номер')
										: t('Номер не нашли — попробуйте ближе и ровнее')}
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
										backgroundColor: active ? fixed.flash : 'rgba(255,255,255,0.92)',
										gap: 2,
									}}
								>
									<Text style={{ fontSize: fs.base, fontFamily: fontFamily(800), color: fixed.inkOnLight }}>{candidate.oem}</Text>
									<Text style={{ fontSize: fs.xxs, fontFamily: fontFamily(600), color: fixed.mutedOnLight }}>
										{candidate.partsFound
											? t('есть у {0} {1}', candidate.partsFound, plural(candidate.partsFound, [t('продавца'), t('продавцов'), t('продавцов')]))
											: t('новый номер')}
									</Text>
								</Pressable>
							)
						})}
					</ScrollView>
				</View>
			) : mode === 1 && draft.oemNumber ? (
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
					<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: fixed.white }}>
						{t('Номер: {0}', draft.oemNumber)}
					</Text>
				</View>
			) : null}

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
										backgroundColor: fixed.white,
									}}
								/>
							) : null}
						</Pressable>
					))}
				</View>
			) : null}


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
				<Pressable accessibilityRole="button" accessibilityLabel={t('Выбрать из галереи')}
					onPress={fromGallery}
					style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<GalleryIcon size={24} color={fixed.white} />
				</Pressable>

				<Pressable
					onPress={capture}
					disabled={recognize.isPending || (mode !== 2 && !ready)}
					accessibilityRole="button"
					accessibilityLabel={t('Сделать снимок')}
					style={{
						width: 80,
						height: 80,
						borderRadius: 40,
						borderWidth: 5,
						borderColor: fixed.white,
						alignItems: 'center',
						justifyContent: 'center',
						opacity: recognize.isPending || (mode !== 2 && !ready) ? 0.5 : 1,
					}}
				>
					<View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: fixed.white }} />
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
					<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: fixed.white }}>{t('Готово')}</Text>
				</Pressable>
			</View>
		</View>
	)
}
