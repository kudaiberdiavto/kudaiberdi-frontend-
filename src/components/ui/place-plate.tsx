import { Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { t } from '@/i18n'

/**
 * The place plate — «ряд 14 | конт. 12» painted like the marking on the market's containers, the app's signature:
 * the one thing that is this yellow, wherever a shop has a place on the market (answers, the part card, the shop,
 * the route, the chat). `walk` — minutes on foot, printed beside it. Shops off the market have no plate (address).
 *
 *   sm — in a line under a shop name;  md — on a card;  lg — the shop's own page.
 */
export function PlacePlate({
	row,
	box,
	walk,
	size = 'sm',
	style,
}: {
	row: string
	box: string | number
	walk?: number | null
	size?: 'sm' | 'md' | 'lg'
	style?: StyleProp<ViewStyle>
}) {
	const c = useColors()
	const s = SIZES[size]
	const cell = (label: string, value: string | number, first: boolean) => (
		<View
			style={{
				paddingHorizontal: s.padX,
				paddingVertical: s.padY,
				justifyContent: 'center',
				borderLeftWidth: first ? 0 : 1.5,
				borderLeftColor: fixed.plateMuted,
				flex: size === 'lg' ? 1 : undefined,
			}}
		>
			<Text style={{ fontSize: s.label, lineHeight: s.label * 1.15, fontFamily: fontFamily(600), color: fixed.plateMuted }}>{label}</Text>
			<Text
				style={{
					fontSize: s.value,
					lineHeight: s.value * 1.1,
					fontFamily: fontFamily(800),
					letterSpacing: -0.3,
					fontVariant: ['tabular-nums'],
					color: fixed.plateInk,
				}}
			>
				{value}
			</Text>
		</View>
	)
	return (
		<View
			style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: size === 'lg' ? 'stretch' : 'flex-start' }, style]}
			accessible
			accessibilityLabel={t('Ряд {0}, контейнер {1}', row, box) + (walk != null ? t(', {0} мин пешком', walk) : '')}
		>
			<View style={{ flexDirection: 'row', borderRadius: s.radius, backgroundColor: fixed.plate, overflow: 'hidden', flex: size === 'lg' ? 1 : undefined }}>
				{cell(t('ряд'), row, true)}
				{cell(t('конт.'), box, false)}
			</View>
			{walk != null ? (
				<Text style={{ fontSize: s.walk, fontFamily: fontFamily(600), color: c.inkSecondary }}>{t('{0} мин пешком', walk)}</Text>
			) : null}
		</View>
	)
}

const SIZES = {
	sm: { label: fs.xxs, value: fs.lg, padX: 9, padY: 3, radius: 7, walk: fs.sm },
	md: { label: fs.xxs, value: fs.h3, padX: 11, padY: 5, radius: 9, walk: fs.md },
	lg: { label: fs.xs, value: fs.h1, padX: 14, padY: 8, radius: 12, walk: fs.md },
} as const
