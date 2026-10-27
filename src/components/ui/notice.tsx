import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { isNetworkError } from '@/lib/api'
import { fontFamily, useColors } from '@/theme'

/** Red banner from screen 20 («Нет сети. Покажем ответы, когда появится»). */
export function NoticeBanner({
	text,
	onPress,
	style,
}: {
	text: string
	onPress?: () => void
	style?: StyleProp<ViewStyle>
}) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={[
				{
					borderRadius: 12,
					backgroundColor: c.dangerTint,
					paddingVertical: 12,
					paddingHorizontal: 14,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				},
				style,
			]}
		>
			<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger }} />
			<Text style={{ flex: 1, fontSize: 15.5, fontFamily: fontFamily(600), color: c.ink }}>{text}</Text>
		</Pressable>
	)
}

/** Banner for a failed query: «Нет сети…» offline, the server's message otherwise. Tap — retry. */
export function QueryErrorBanner({
	error,
	onRetry,
	offlineText = 'Нет сети. Обновим, когда появится',
	style,
}: {
	error: unknown
	onRetry?: () => void
	offlineText?: string
	style?: StyleProp<ViewStyle>
}) {
	if (!error) return null
	const text = isNetworkError(error) ? offlineText : ((error as Error).message ?? 'Не удалось загрузить')
	return <NoticeBanner text={text} onPress={onRetry} style={style} />
}
