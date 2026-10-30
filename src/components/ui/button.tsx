import type { ComponentType } from 'react'
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native'
import type { IconProps } from '@/components/icons'
import { fontFamily, useColors, raw } from '@/theme'

/** `success` — green: «Позвонить», «Написать». */
type Variant = 'primary' | 'secondary' | 'outline' | 'success'

interface ButtonProps {
	label: string
	onPress?: () => void
	variant?: Variant
	/** Высота из макета: 48 / 52 / 56 / 60. */
	height?: number
	radius?: number
	fontSize?: number
	disabled?: boolean
	/** Request in flight: keeps the size, swaps the label for a small spinner. */
	loading?: boolean
	/** Icon left of the label, in the label colour (37: «Позвонить», «Написать»). */
	icon?: ComponentType<IconProps>
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
	loading,
	icon: Icon,
	style,
}: ButtonProps) {
	const c = useColors()
	const bg = variant === 'primary' ? c.brand : variant === 'success' ? c.success : variant === 'secondary' ? raw.fill : 'transparent'
	const fg = variant === 'primary' || variant === 'success' ? '#FFFFFF' : variant === 'secondary' ? c.ink : c.inkSecondary

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={[
				{
					height,
					borderRadius: radius,
					backgroundColor: bg,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 8,
					paddingHorizontal: 12,
					opacity: disabled ? 0.4 : 1,
				},
				variant === 'outline' && { borderWidth: 2, borderColor: c.border },
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={fg} />
			) : (
				<>
					{Icon ? <Icon size={20} color={fg} strokeWidth={2.2} /> : null}
					<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ flexShrink: 1, fontSize, fontFamily: fontFamily(700), color: fg }}>{label}</Text>
				</>
			)}
		</Pressable>
	)
}
