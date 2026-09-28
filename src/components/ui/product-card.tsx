import { Pressable, Text, View } from 'react-native'
import { CheckIcon, MapPinIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { PhotoPlaceholder } from './photo'

/** Карточка товара в сетке — экраны 27, 29 (похожие), 30. 174×243 из specs. */
export function ProductCard({
	price,
	title,
	fits,
	location,
	onPress,
	width = 174,
}: {
	price: string
	title: string
	fits?: boolean
	location: string
	onPress?: () => void
	width?: number
}) {
	const c = useColors()
	return (
		<Pressable onPress={onPress} style={{ width, borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
			<View>
				<PhotoPlaceholder width={width} height={118} radius={0} />
				<View
					style={{
						position: 'absolute',
						right: 8,
						top: 8,
						width: 30,
						height: 30,
						borderRadius: 15,
						backgroundColor: 'rgba(255,255,255,0.9)',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<MapPinIcon size={16} color={c.ink} />
				</View>
			</View>

			<View style={{ padding: 10, gap: 6 }}>
				<Text style={{ fontSize: 17, fontFamily: fontFamily(800), color: c.ink }}>{price}</Text>
				<Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 16.9, fontFamily: fontFamily(400), color: c.inkSecondary }}>
					{title}
				</Text>
				{fits ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
						<CheckIcon size={14} color={c.success} strokeWidth={3} />
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: c.success }}>Подходит</Text>
					</View>
				) : null}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
					<View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EEEEEE' }} />
					<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>{location}</Text>
				</View>
			</View>
		</Pressable>
	)
}
