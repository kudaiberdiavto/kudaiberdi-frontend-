import { Pressable } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useColors } from '@/theme'
import { t } from '@/i18n'

/** «⋯» in a card's corner — the visible way to actions that used to hide behind a long press (report, delete). */
export function MoreButton({ onPress, label = t('Ещё действия') }: { onPress: () => void; label?: string }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			hitSlop={10}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={{ width: 28, height: 22, alignItems: 'center', justifyContent: 'center' }}
		>
			<Svg width={18} height={4} viewBox="0 0 18 4" fill={c.muted}>
				<Circle cx={2} cy={2} r={2} />
				<Circle cx={9} cy={2} r={2} />
				<Circle cx={16} cy={2} r={2} />
			</Svg>
		</Pressable>
	)
}
