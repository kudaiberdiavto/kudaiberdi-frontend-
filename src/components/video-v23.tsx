// Videos from the market: icons of the feed, the autoplaying tile of «Видео с рынка» and the delivery pieces
// (truck, «Ылдам Экспресс», day / price labels, the 17:30 cut-off). Sizes and colours — from the mockup.
import { useEffect, type ReactNode } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video'
import { PlayIcon, voiceClock } from '@/components/voice'
import { priceDigits } from '@/components/buyer-v23'
import { resolveUrl } from '@/lib/api'
import { fontFamily } from '@/theme'
import { useSignedIn } from '@/api/catalog'
import { useCars } from '@/api/garage'
import type { DeliveryOrder, Video } from '@/api/types'
import { useVideoViewer } from '@/store/useVideoViewer'

interface IconProps {
	size?: number
	color: string
	strokeWidth?: number
}

function Stroke({ size = 24, color, strokeWidth = 2.2, children }: IconProps & { children: ReactNode }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			{children}
		</Svg>
	)
}

/** Tab «Рынок»: a rounded screen with ▶ — the feed of videos. */
export const ReelsIcon = (p: IconProps) => (
	<Stroke strokeWidth={1.9} {...p}>
		<Rect x="5" y="3" width="14" height="18" rx="3" />
		<Path d="M10.5 9.5v5l4-2.5z" />
	</Stroke>
)
export const BookmarkIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
	<Svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill={filled ? p.color : 'none'} stroke={p.color} strokeWidth={p.strokeWidth ?? 2.2} strokeLinejoin="round">
		<Path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" />
	</Svg>
)
export const SoundOffIcon = (p: IconProps) => (
	<Stroke {...p}>
		<Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
		<Path d="m16 9.5 5 5M21 9.5l-5 5" />
	</Stroke>
)
export const SoundOnIcon = (p: IconProps) => (
	<Stroke {...p}>
		<Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
		<Path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
	</Stroke>
)
export const TruckIcon = (p: IconProps) => (
	<Stroke {...p}>
		<Path d="M3 16V7h11v9M14 10.5h3.5L21 14v2H3" />
		<Circle cx="7" cy="17" r="1.8" />
		<Circle cx="17" cy="17" r="1.8" />
	</Stroke>
)
export const ClockOutline = (p: IconProps) => (
	<Stroke {...p}>
		<Circle cx="12" cy="12" r="8.5" />
		<Path d="M12 7.5V12l3 2" />
	</Stroke>
)
export const WhatsAppIcon = (p: IconProps) => (
	<Stroke {...p}>
		<Path d="M4 20l1.3-3.9A8.5 8.5 0 1 1 8 19z" />
		<Path d="M9 9.5c.3 2.2 2.3 4.3 4.5 4.8l1.2-1.3 1.8.8-.3 1.5c-3.6.5-7.6-3.4-7.2-7l1.5-.3.8 1.8z" />
	</Stroke>
)

/** Yellow «Ылдам Экспресс» / «Доставка по КР» chip. */
export function YellowChip({ label, icon, height = 26 }: { label: string; icon?: boolean; height?: number }) {
	return (
		<View
			style={{
				height,
				paddingHorizontal: 10,
				borderRadius: height / 2,
				backgroundColor: '#FCE7A2',
				flexDirection: 'row',
				alignItems: 'center',
				gap: 5,
				alignSelf: 'flex-start',
			}}
		>
			{icon ? <TruckIcon size={15} color="#6B4E00" strokeWidth={2.2} /> : null}
			<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: '#6B4E00' }}>{label}</Text>
		</View>
	)
}

/** Yellow tile with a truck — «Отправлю в регионы». */
export function TruckTile({ size = 40 }: { size?: number }) {
	return (
		<View style={{ width: size, height: size, borderRadius: 12, backgroundColor: '#FCE7A2', alignItems: 'center', justifyContent: 'center' }}>
			<TruckIcon size={size * 0.55} color="#6B4E00" />
		</View>
	)
}

/** «Звук» — the player is a native object, its property is set outside the hook's value. */
export function setPlayerMuted(player: VideoPlayer, muted: boolean) {
	player.muted = muted
}

/** A muted looping player of one video: plays while `playing`. */
export function LoopVideo({ url, playing, muted = true, style }: { url: string; playing: boolean; muted?: boolean; style: object }) {
	const player = useVideoPlayer(resolveUrl(url), (p) => {
		p.loop = true
		p.muted = muted
	})
	useEffect(() => setPlayerMuted(player, muted), [player, muted])
	useEffect(() => {
		if (playing) player.play()
		else player.pause()
	}, [player, playing])
	// pointerEvents none: the native view would take the taps and swipes meant for the tile and the list.
	return (
		<View pointerEvents="none" style={style}>
			<VideoView player={player} nativeControls={false} contentFit="cover" style={{ width: '100%', height: '100%' }} />
		</View>
	)
}

/**
 * A tile of «Видео с рынка» [главная]: 9:16, plays by itself without sound, «▶ 0:15», title, price,
 * «Ряд 14 · конт. 12». A tap opens the feed with this video.
 */
export function VideoTile({
	video,
	title,
	price,
	place,
	playing,
	onPress,
}: {
	video: Video
	title: string
	price: number
	place: string
	playing: boolean
	onPress: () => void
}) {
	const poster = resolveUrl(video.posterUrl)
	return (
		<Pressable onPress={onPress} style={{ width: 142, height: 206, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1F2329' }}>
			{poster ? <Image source={{ uri: poster }} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
			{/* A player only while the tile plays — a player per tile (10 on screen, more off it) slows the phone down. */}
			{playing ? <LoopVideo url={video.url} playing style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
			<LinearGradient
				colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
				start={{ x: 0.5, y: 0.35 }}
				end={{ x: 0.5, y: 1 }}
				style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
			/>
			<View
				style={{
					position: 'absolute',
					top: 8,
					left: 8,
					height: 22,
					paddingHorizontal: 7,
					borderRadius: 7,
					backgroundColor: 'rgba(0,0,0,0.55)',
					flexDirection: 'row',
					alignItems: 'center',
					gap: 3,
				}}
			>
				<PlayIcon size={10} />
				<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{voiceClock(video.durationSec)}</Text>
			</View>
			<View style={{ position: 'absolute', left: 8, right: 8, bottom: 8, gap: 2 }}>
				<Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 18.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
					{title}
				</Text>
				<Text style={{ fontSize: 17, fontFamily: fontFamily(800), color: '#FFFFFF' }}>{priceDigits(price)} с</Text>
				<Text numberOfLines={1} style={{ fontSize: 12, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.75)' }}>
					{place}
				</Text>
			</View>
		</Pressable>
	)
}

/**
 * The car of «✓ Camry 50» and «для Camry 50»: the main car of the garage. With `byCar` the feed puts the videos
 * fitting it first (the same query on the home screen and in the feed, so they share the loaded pages).
 */
export function useFeedCar() {
	const signedIn = useSignedIn()
	const cars = useCars(signedIn)
	const byCar = useVideoViewer((s) => s.byCar)
	const car = signedIn ? (cars.data?.find((item) => item.isPrimary) ?? cars.data?.[0]) : undefined
	const params = byCar && car ? { brandId: car.brand.id, modelId: car.model.id, year: car.year } : {}
	return { car, byCar, params }
}

// ─── Delivery ────────────────────────────────────────────────────────────────

/** Minutes of the Bishkek day (UTC+6, no DST) — the courier's 17:30 cut-off is in market time. */
export function bishkekMinutes(now = new Date()) {
	return (now.getUTCHours() * 60 + now.getUTCMinutes() + 6 * 60) % (24 * 60)
}

/** «17:30» → before it the courier picks the parcel up today. */
export function beforeCutoff(cutoff: string, now = new Date()) {
	const [h, m] = cutoff.split(':').map(Number)
	return bishkekMinutes(now) < h * 60 + (m || 0)
}

/** «в Ош», «в Чуйскую обл.» — where the parcel goes (accusative of the region's name). */
export function toRegion(name: string) {
	return name.replace(/ая обл\.$/, 'ую обл.')
}

/** «Бишкек → Ош», «По Бишкеку». */
export function routeTitle(order: Pick<DeliveryOrder, 'region' | 'regionName' | 'districtName'>) {
	return order.region === 'BISHKEK' ? 'По Бишкеку' : `Бишкек → ${order.districtName ?? order.regionName}`
}

/** The buyer's line of a parcel: «Упакована — ждёт курьера», «В пути в Ош». */
export function deliveryStatusText(order: DeliveryOrder) {
	switch (order.status) {
		case 'NEW':
			return 'Оформлена — продавец упакует'
		case 'PACKED':
			return 'Упакована — ждёт курьера'
		case 'COURIER_ORDERED':
			return 'Курьер едет за посылкой'
		case 'PICKED_UP':
			return order.region === 'BISHKEK' ? 'Едет к вам' : `В пути в ${toRegion(order.districtName ?? order.regionName)}`
		case 'DELIVERED':
			return 'Доставлена'
		case 'CANCELLED':
			return 'Отменена'
	}
}

/** «+996555123456» → «+996 555 123 456». */
export function formatKgPhone(phone: string | null | undefined) {
	if (!phone) return ''
	const digits = phone.replace(/\D/g, '')
	const m = /^996(\d{3})(\d{3})(\d{3})$/.exec(digits)
	return m ? `+996 ${m[1]} ${m[2]} ${m[3]}` : phone
}
