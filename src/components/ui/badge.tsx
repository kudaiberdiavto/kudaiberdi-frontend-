import { Text, View } from 'react-native'
import { fontFamily, fs, useColors } from '@/theme'

type Tone = 'success' | 'neutral' | 'brand' | 'muted'

interface BadgeProps {
	label: string
	tone?: Tone
}

/** Статус-бейдж из карточек запросов: «3 ответили», «Ждём ответов», «Основная». */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
	const c = useColors()
	const palette: Record<Tone, { bg: string; fg: string }> = {
		success: { bg: c.successTint, fg: c.success },
		neutral: { bg: c.fill, fg: c.inkSecondary },
		brand: { bg: c.brandTint, fg: c.brandStrong },
		muted: { bg: 'transparent', fg: c.fillInk },
	}
	const { bg, fg } = palette[tone]

	return (
		<View
			style={{
				height: 28,
				paddingHorizontal: tone === 'muted' ? 0 : 10,
				borderRadius: 8,
				backgroundColor: bg,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(700), color: fg }}>{label}</Text>
		</View>
	)
}
