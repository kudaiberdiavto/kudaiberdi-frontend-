import { Text, View } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { Button, QueryErrorBanner } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { useQrResolve } from '@/api/market'

/**
 * QR sticker of a row or a container (https://kudaibergen.kg/qr/{token}) scanned with the phone camera:
 * a container → the route to it [18], a row → the market map [15].
 */
export default function QrLink() {
	const c = useColors()
	const { token } = useLocalSearchParams<{ token: string }>()
	const qr = useQrResolve(token)

	if (qr.data?.type === 'CONTAINER' && qr.data.container) {
		return <Redirect href={{ pathname: '/route', params: { containerId: String(qr.data.container.containerId) } }} />
	}
	if (qr.data?.type === 'ROW') return <Redirect href="/buyer/market" />

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, padding: 24, justifyContent: 'center', gap: 14 }}>
			<QueryErrorBanner error={qr.error} onRetry={() => qr.refetch()} />
			<Text style={{ fontSize: 16, fontFamily: fontFamily(600), color: c.muted, textAlign: 'center' }}>
				{qr.error ? 'QR-код не относится к рынку' : 'Открываем место на рынке…'}
			</Text>
			{qr.error ? <Button label="К карте рынка" onPress={() => router.replace('/buyer/market')} /> : null}
		</View>
	)
}
