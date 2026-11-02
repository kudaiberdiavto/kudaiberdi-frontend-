import type { ComponentType } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { IconProps } from '@/components/icons'
import { isNetworkError } from '@/lib/api'
import { fontFamily, useColors } from '@/theme'
import { t } from '@/i18n'

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
	offlineText = t('Нет сети. Обновим, когда появится'),
	style,
}: {
	error: unknown
	onRetry?: () => void
	offlineText?: string
	style?: StyleProp<ViewStyle>
}) {
	if (!error) return null
	const text = isNetworkError(error) ? offlineText : ((error as Error).message ?? t('Не удалось загрузить'))
	return <NoticeBanner text={text} onPress={onRetry} style={style} />
}

/**
 * An empty list: an icon in a tinted circle and a short title, centred in the free space (the list needs `contentContainerStyle.flexGrow: 1`).
 * `hint` and `action` turn a dead end into a next step («Ничего не нашли» → «Спросить у продавцов»).
 */
export function EmptyState({
	title,
	icon: Icon,
	hint,
	action,
	secondary,
}: {
	title: string
	icon?: ComponentType<IconProps>
	hint?: string
	action?: { label: string; onPress: () => void }
	/** A quieter way out under the main action («Сбросить фильтры»). */
	secondary?: { label: string; onPress: () => void }
}) {
	const c = useColors()
	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60, gap: 16 }}>
			{Icon ? (
				<View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
					<Icon size={44} color={c.brandStrong} strokeWidth={1.8} />
				</View>
			) : null}
			<View style={{ gap: 6 }}>
				<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink, textAlign: 'center' }}>{title}</Text>
				{hint ? (
					<Text style={{ fontSize: 16, lineHeight: 22, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center' }}>{hint}</Text>
				) : null}
			</View>
			{action ? (
				<Pressable
					onPress={action.onPress}
					accessibilityRole="button"
					style={{ height: 50, paddingHorizontal: 22, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
				>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{action.label}</Text>
				</Pressable>
			) : null}
			{secondary ? (
				<Text onPress={secondary.onPress} accessibilityRole="button" style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.brandStrong }}>
					{secondary.label}
				</Text>
			) : null}
		</View>
	)
}
