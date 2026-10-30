import type { ComponentType } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { IconProps } from '@/components/icons'
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

/** An empty list: an icon in a tinted circle and a short title, centred in the free space (the list needs `contentContainerStyle.flexGrow: 1`). */
export function EmptyState({ title, icon: Icon }: { title: string; icon?: ComponentType<IconProps> }) {
	const c = useColors()
	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60, gap: 16 }}>
			{Icon ? (
				<View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<Icon size={44} color={c.brandStrong} strokeWidth={1.8} />
				</View>
			) : null}
			<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink, textAlign: 'center' }}>{title}</Text>
		</View>
	)
}
