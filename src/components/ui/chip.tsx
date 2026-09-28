import { Pressable, Text } from 'react-native'
import { fontFamily, useColors } from '@/theme'

interface ChipProps {
	label: string
	selected?: boolean
	onPress?: () => void
	height?: number
	radius?: number
	fontSize?: number
	paddingHorizontal?: number
}

export function Chip({
	label,
	selected,
	onPress,
	height = 40,
	radius = 20,
	fontSize = 14,
	paddingHorizontal = 14,
}: ChipProps) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				height,
				borderRadius: radius,
				paddingHorizontal,
				borderWidth: 2,
				borderColor: selected ? c.brand : c.border,
				backgroundColor: selected ? c.brandTint : c.card,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Text
				style={{
					fontSize,
					fontFamily: fontFamily(selected ? 700 : 600),
					color: selected ? c.brandStrong : c.inkSecondary,
				}}
			>
				{label}
			</Text>
		</Pressable>
	)
}
