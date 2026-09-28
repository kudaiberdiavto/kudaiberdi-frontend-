import { View, type StyleProp, type ViewStyle } from 'react-native'
import { CameraIcon } from '@/components/icons'
import { raw, useColors } from '@/theme'

/** Заглушка фото (товар, место, обложка) — реальные фото приходят от пользователя, здесь только форма и радиус из specs. */
export function PhotoPlaceholder({
	width,
	height,
	radius = 16,
	style,
}: {
	width?: number
	height?: number
	radius?: number
	style?: StyleProp<ViewStyle>
}) {
	const c = useColors()
	return (
		<View
			style={[
				{
					width,
					height,
					borderRadius: radius,
					backgroundColor: raw.fill,
					alignItems: 'center',
					justifyContent: 'center',
					overflow: 'hidden',
				},
				style,
			]}
		>
			<CameraIcon size={typeof height === 'number' ? Math.min(width ?? height, height) * 0.3 : 28} color={c.border} strokeWidth={1.6} />
		</View>
	)
}
