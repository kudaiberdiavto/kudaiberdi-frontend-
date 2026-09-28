import { useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Button } from '@/components/ui'
import { CloseIcon, FlashIcon, GalleryIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { cameraScreen } from '@/mocks'

export default function CameraScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const cameraRef = useRef<CameraView>(null)
	const [permission, requestPermission] = useCameraPermissions()
	const [mode, setMode] = useState(cameraScreen.activeMode)
	const [torch, setTorch] = useState(false)
	const [shots, setShots] = useState<string[]>([])

	if (!permission) return null

	if (!permission.granted) {
		return (
			<View style={{ flex: 1, backgroundColor: '#0B0B0C', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
				<Text style={{ fontSize: 16, color: '#FFFFFF', textAlign: 'center' }}>Нужен доступ к камере, чтобы сфотографировать запчасть</Text>
				<Button label="Разрешить камеру" onPress={requestPermission} />
			</View>
		)
	}

	const capture = async () => {
		const photo = await cameraRef.current?.takePictureAsync()
		if (photo && shots.length < 6) setShots((prev) => [...prev, photo.uri])
	}

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
				<Text style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
					{cameraScreen.title} · {shots.length} из 6
				</Text>
				<Pressable
					onPress={() => setTorch((v) => !v)}
					style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<FlashIcon size={20} color="#FFD54A" />
				</Pressable>
			</View>

			<View
				pointerEvents="none"
				style={{
					position: 'absolute',
					left: 30,
					top: 150,
					width: 330,
					height: 330,
				}}
			>
				{([
					{ left: 0, top: 0, rotate: '0deg' },
					{ right: 0, top: 0, rotate: '90deg' },
					{ right: 0, bottom: 0, rotate: '180deg' },
					{ left: 0, bottom: 0, rotate: '270deg' },
				] as const).map(({ rotate, ...position }, i) => (
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
				<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: '#FFFFFF' }}>{cameraScreen.hint}</Text>
			</View>

			<View style={{ position: 'absolute', left: 16, right: 16, top: 556, flexDirection: 'row', gap: 8 }}>
				{[0, 1].map((i) => (
					<View
						key={i}
						style={{
							width: 56,
							height: 56,
							borderRadius: 10,
							backgroundColor: shots[i] ? '#3A3A3C' : 'rgba(255,255,255,0.14)',
						}}
					/>
				))}
				<View style={{ width: 60, height: 60, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' }} />
			</View>

			<View style={{ position: 'absolute', left: 16, right: 16, top: 637, flexDirection: 'row', justifyContent: 'space-between' }}>
				{cameraScreen.modes.map((label, i) => (
					<Pressable key={label} onPress={() => setMode(i)}>
						<Text
							style={{
								fontSize: 14,
								fontFamily: fontFamily(700),
								color: mode === i ? '#FFD54A' : 'rgba(255,255,255,0.55)',
							}}
						>
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
					style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
				>
					<GalleryIcon size={24} color="#FFFFFF" />
				</Pressable>

				<Pressable
					onPress={capture}
					style={{
						width: 80,
						height: 80,
						borderRadius: 40,
						borderWidth: 5,
						borderColor: '#FFFFFF',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' }} />
				</Pressable>

				<Pressable
					onPress={() => router.back()}
					style={{
						height: 52,
						paddingHorizontal: 18,
						borderRadius: 26,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{cameraScreen.doneLabel}</Text>
				</Pressable>
			</View>
		</View>
	)
}
