import { Image, Pressable, Text, View } from 'react-native'
import { CheckIcon, HeartIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import Svg, { Path } from 'react-native-svg'
import { PhotoPlaceholder } from './photo'

/** Карточка товара в сетке — экраны 27, 29 (похожие), 30. 174×243 из specs. */
export function ProductCard({
	price,
	title,
	fits,
	location,
	onPress,
	width = 174,
	photoUrl,
	shopAvatarUrl,
	dimmed,
	favorite,
	videoSec,
}: {
	price: string
	title: string
	fits?: boolean
	location: string
	onPress?: () => void
	width?: number
	/** Main photo (`mainPhoto.thumbUrl`); without it — the drawn placeholder. */
	photoUrl?: string | null
	shopAvatarUrl?: string | null
	/** Out of stock — shown faded. */
	dimmed?: boolean
	/** ♥ in the corner, filled when the part is in favorites. */
	favorite?: boolean
	/** The part has a video: «▶ 0:15» on the picture (the video's poster). */
	videoSec?: number
}) {
	const c = useColors()
	return (
		<Pressable onPress={onPress} style={{ width, borderRadius: 16, backgroundColor: c.card, overflow: 'hidden', opacity: dimmed ? 0.6 : 1 }}>
			<View>
				{photoUrl ? (
					<Image source={{ uri: photoUrl }} style={{ width, height: 118 }} resizeMode="cover" />
				) : (
					<PhotoPlaceholder width={width} height={118} radius={0} />
				)}
				{videoSec != null ? (
					<View
						style={{
							position: 'absolute',
							left: 8,
							top: 8,
							height: 24,
							paddingHorizontal: 8,
							borderRadius: 12,
							backgroundColor: 'rgba(0,0,0,0.55)',
							flexDirection: 'row',
							alignItems: 'center',
							gap: 4,
						}}
					>
						<Svg width={10} height={10} viewBox="0 0 24 24" fill="#FFFFFF">
							<Path d="M8 5.5v13l10-6.5z" />
						</Svg>
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
							{Math.floor(videoSec / 60)}:{String(Math.round(videoSec % 60)).padStart(2, '0')}
						</Text>
					</View>
				) : null}
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
					<HeartIcon size={16} color={favorite ? c.danger : c.ink} filled={favorite} />
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
					{shopAvatarUrl ? (
						<Image source={{ uri: shopAvatarUrl }} style={{ width: 20, height: 20, borderRadius: 10 }} />
					) : (
						<View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EEEEEE' }} />
					)}
					<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted }}>{location}</Text>
				</View>
			</View>
		</Pressable>
	)
}
