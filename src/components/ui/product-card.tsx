import { Image, Pressable, Text, View } from 'react-native'
import { CheckIcon, HeartIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import Svg, { Path } from 'react-native-svg'
import { PhotoPlaceholder } from './photo'

/**
 * Карточка товара в сетке — как на маркетплейсах: квадратное фото со скруглением без подложки (♥, «✓ Подходит»,
 * «▶ 0:15» на фото), под ним цена, название и магазин. По ширине колонки (или `width`).
 */
export function ProductCard({
	price,
	title,
	fits,
	location,
	shopName,
	onPress,
	width,
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
	/** «Автодеталь Азамат» before the place. */
	shopName?: string
	onPress?: () => void
	/** Column width; without it — the parent's width. */
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
		<Pressable onPress={onPress} style={{ width: width ?? '100%', gap: 8, opacity: dimmed ? 0.6 : 1 }}>
			<View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: c.card }}>
				{photoUrl ? (
					<Image source={{ uri: photoUrl }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
				) : (
					<View style={{ width: '100%', aspectRatio: 1, overflow: 'hidden' }}>
						<PhotoPlaceholder width={width ?? 200} height={width ?? 200} radius={0} />
					</View>
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
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
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
				{fits ? (
					<View
						style={{
							position: 'absolute',
							left: 8,
							bottom: 8,
							height: 26,
							paddingHorizontal: 8,
							borderRadius: 13,
							backgroundColor: c.success,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 4,
						}}
					>
						<CheckIcon size={14} color="#FFFFFF" strokeWidth={3} />
						<Text style={{ fontSize: 13.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Подходит</Text>
					</View>
				) : null}
			</View>

			<View style={{ paddingHorizontal: 2, gap: 4 }}>
				<Text style={{ fontSize: 20, fontFamily: fontFamily(800), color: c.ink }}>{price}</Text>
				<Text numberOfLines={2} style={{ fontSize: 16, lineHeight: 21, fontFamily: fontFamily(400), color: c.ink }}>
					{title}
				</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 }}>
					{shopAvatarUrl ? <Image source={{ uri: shopAvatarUrl }} style={{ width: 20, height: 20, borderRadius: 10 }} /> : null}
					<Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
						{[shopName, location].filter(Boolean).join(' · ')}
					</Text>
				</View>
			</View>
		</Pressable>
	)
}
