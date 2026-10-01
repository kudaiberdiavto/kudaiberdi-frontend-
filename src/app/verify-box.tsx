import { useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Button } from '@/components/ui'
import { CloseIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { formatPlace } from '@/lib/format'
import { useRequestAdminVerification, useVerification, useVerifyByQr } from '@/api/shop'

/** QR stickers carry `https://kudaibergen.kg/qr/{token}` — the token is the last path segment. */
function tokenFromQr(data: string) {
	return data.trim().split(/[/?#]/).filter(Boolean).pop() ?? data.trim()
}

/**
 * Place check after registration or moving [10а → 10 → here]. No mockup; built from the camera
 * screen 25. Until approved the box gets no requests.
 */
export default function VerifyBoxScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [permission, requestPermission] = useCameraPermissions()
	const verification = useVerification()
	const verify = useVerifyByQr()
	const admin = useRequestAdminVerification()
	const lastScanned = useRef<string | null>(null)

	const data = verification.data
	const target = data?.target
	const approved = data && !data.required
	const waiting = data?.waitingForAdmin

	const onScan = (value: string) => {
		const token = tokenFromQr(value)
		// The camera fires many times per second — send each sticker once, retry only after an error.
		if (verify.isPending || token === lastScanned.current) return
		lastScanned.current = token
		verify.mutate(
			{ qrToken: token },
			{
				onSuccess: (result) => !result.required && router.replace('/seller'),
				onError: () => setTimeout(() => (lastScanned.current = null), 2500),
			}
		)
	}

	const status = approved
		? 'Место подтверждено'
		: waiting
			? 'Заявка у администрации — проверим до 1 рабочего дня'
			: verify.error
				? verify.error.message
				: verify.isPending
					? 'Проверяем…'
					: 'Наведите камеру на наклейку с QR на контейнере'

	return (
		<View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
			{permission?.granted && !approved ? (
				<CameraView
					style={{ flex: 1 }}
					barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
					onBarcodeScanned={({ data: value }) => onScan(value)}
				/>
			) : (
				<View style={{ flex: 1 }} />
			)}

			<View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', gap: 12 }}>
				<Pressable
					onPress={() => router.replace('/seller')}
					style={{
						width: 44,
						height: 44,
						borderRadius: 22,
						backgroundColor: 'rgba(0,0,0,0.45)',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<CloseIcon size={22} color="#FFFFFF" />
				</Pressable>
				<View style={{ flex: 1, gap: 2, paddingTop: 2 }}>
					<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Подтвердите место</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.75)' }}>
						{target ? `Отсканируйте QR на контейнере ${formatPlace(target)}` : ' '}
					</Text>
				</View>
			</View>

			{permission?.granted && !approved ? (
				<View
					pointerEvents="none"
					style={{
						position: 'absolute',
						alignSelf: 'center',
						top: '30%',
						width: 240,
						height: 240,
						borderRadius: 24,
						borderWidth: 3,
						borderColor: verify.error ? c.danger : '#FFFFFF',
					}}
				/>
			) : null}

			<View
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 18,
					paddingHorizontal: 16,
					paddingBottom: insets.bottom + 16,
					gap: 12,
				}}
			>
				<Text
					style={{
						fontSize: 16,
						lineHeight: 22,
						fontFamily: fontFamily(600),
						color: verify.error && !approved ? c.danger : approved ? c.success : c.ink,
					}}
				>
					{status}
				</Text>
				<Text style={{ fontSize: 14, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>
					Пока место не подтверждено, запросы покупателей не приходят.
				</Text>

				{!permission?.granted && !approved ? (
					<Button label="Разрешить камеру" onPress={requestPermission} />
				) : null}
				{approved ? <Button label="К запросам" onPress={() => router.replace('/seller')} /> : null}
				{!approved && !waiting ? (
					<Button
						label="Нет наклейки — попросить администрацию"
						variant="secondary"
						height={52}
						fontSize={15}
						loading={admin.isPending}
						onPress={() => admin.mutate()}
					/>
				) : null}
				{admin.error ? (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{admin.error.message}</Text>
				) : null}
			</View>
		</View>
	)
}
