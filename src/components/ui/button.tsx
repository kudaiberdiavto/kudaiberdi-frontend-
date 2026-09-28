import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native'
import { fontFamily, useColors, raw } from '@/theme'

type Variant = 'primary' | 'secondary' | 'outline'

interface ButtonProps {
	label: string
	onPress?: () => void
	variant?: Variant
	/** Высота из макета: 48 / 52 / 56 / 60. */
	height?: number
	radius?: number
	fontSize?: number
	disabled?: boolean
	style?: StyleProp<ViewStyle>
}

export function Button({
	label,
	onPress,
	variant = 'primary',
	height = 56,
	radius = 14,
	fontSize = 17,
	disabled,
	style,
}: ButtonProps) {
	const c = useColors()
	const bg = variant === 'primary' ? c.brand : variant === 'secondary' ? raw.fill : 'transparent'
	const fg = variant === 'primary' ? '#FFFFFF' : variant === 'secondary' ? c.ink : c.inkSecondary

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={[
				{
					height,
					borderRadius: radius,
					backgroundColor: bg,
					alignItems: 'center',
					justifyContent: 'center',
					opacity: disabled ? 0.4 : 1,
				},
				variant === 'outline' && { borderWidth: 2, borderColor: c.border },
				style,
			]}
		>
			<Text style={{ fontSize, fontFamily: fontFamily(700), color: fg }}>{label}</Text>
		</Pressable>
	)
}
