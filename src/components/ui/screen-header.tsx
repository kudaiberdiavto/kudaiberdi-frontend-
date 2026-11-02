import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeftIcon, CloseIcon } from '@/components/icons'
import { fontFamily, fs, useColors } from '@/theme'
import { t } from '@/i18n'

/**
 * The one header of a pushed screen: ‹ back (or ✕ for a modal flow), the title, an optional right slot.
 * `big` — the 26 px title of a flow's first screen. `inset` — adds the safe area on top, for screens whose
 * container doesn't. Back shows only when there is somewhere to go back to, unless `onBack` is given.
 */
export function ScreenHeader({
	title,
	big,
	onBack,
	onClose,
	right,
	inset,
}: {
	title?: string
	big?: boolean
	onBack?: (() => void) | false
	onClose?: () => void
	right?: ReactNode
	inset?: boolean
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const back = onBack !== false && !onClose && (onBack || router.canGoBack())
	return (
		<View style={{ height: 52, marginTop: inset ? insets.top : 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			{back ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t('Назад')}
					onPress={onBack || (() => router.back())}
					hitSlop={12}
					style={{ marginLeft: -4 }}
				>
					<ChevronLeftIcon size={26} color={c.ink} />
				</Pressable>
			) : null}
			<Text
				numberOfLines={1}
				accessibilityRole="header"
				style={{ flex: 1, fontSize: big ? fs.h1 : fs.xxl, fontFamily: fontFamily(700), letterSpacing: big ? -0.26 : -0.2, color: c.ink }}
			>
				{title ?? ''}
			</Text>
			{right}
			{onClose ? (
				<Pressable accessibilityRole="button" accessibilityLabel={t('Закрыть')} onPress={onClose} hitSlop={12}>
					<CloseIcon size={22} color={c.ink} />
				</Pressable>
			) : null}
		</View>
	)
}
