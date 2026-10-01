import type { ReactNode } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { ChatIcon, ClockIcon, MapPinIcon, PhoneIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import type { ServiceType } from '@/api/types'
import { Button } from './button'

/** `ServiceType.code` — a directory value, new codes may come from the server. */
type ServiceCode = string

// Shared pieces of the service flow [05б, 33–39].

/** Icons from design/new/assets/services — 24×24 outline, stroke in `color`. */
const SERVICE_ICONS: Record<string, ReactNode> = {
	CAR_REPAIR: <Path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.3 2.3-2.3-.7-.7-2.3z" />,
	TIRE_SERVICE: (
		<>
			<Circle cx={12} cy={12} r={8.5} />
			<Circle cx={12} cy={12} r={3.5} />
			<Path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" />
		</>
	),
	LPG: (
		<>
			<Rect x={7} y={6} width={10} height={15} rx={4} />
			<Path d="M10 6V3.5h4V6M7 11h10" />
		</>
	),
	TOW_TRUCK: (
		<>
			<Path d="M2.5 16V9h6l2 3h4.5l6 4v1.5H2.5z" />
			<Circle cx={6.5} cy={17.5} r={1.8} />
			<Circle cx={17} cy={17.5} r={1.8} />
			<Path d="M14 12 20 5" />
		</>
	),
	CAR_WASH: (
		<>
			<Path d="M12 3.5s-4.5 5.2-4.5 8.5a4.5 4.5 0 0 0 9 0c0-3.3-4.5-8.5-4.5-8.5z" />
			<Path d="M4 20.5h16" />
		</>
	),
	AUTO_ELECTRIC: <Path d="M13 3 6 13h5l-1 8 7-10h-5z" />,
	BODY_PAINT: (
		<>
			<Path d="M5 20l4-4M8.5 13.5l6-6 2 2-6 6z" />
			<Path d="M14.5 7.5l2-2a1.5 1.5 0 0 1 2 2l-2 2" />
		</>
	),
	DIAGNOSTICS: (
		<>
			<Path d="M4 16a8 8 0 1 1 16 0" />
			<Path d="M12 16l3.5-4.5" />
			<Circle cx={12} cy={16} r={1.4} />
		</>
	),
	OIL_CHANGE: (
		<>
			<Path d="M4 9h9l3-2h4v3l-5 4H6z" />
			<Path d="M19 14s-1.5 1.8-1.5 2.8a1.5 1.5 0 0 0 3 0c0-1-1.5-2.8-1.5-2.8z" />
		</>
	),
	WHEEL_ALIGNMENT: (
		<>
			<Path d="M7 5v14M17 5v14" />
			<Path d="M4 8l6 8M20 8l-6 8" />
		</>
	),
	TINTING: (
		<>
			<Rect x={3.5} y={6} width={17} height={12} rx={2} />
			<Path d="M3.5 13 10 6.5M9 18l11-9" />
		</>
	),
	MOBILE_MASTER: (
		<>
			<Path d="M3 16V8h10v8M13 11h4l3 3v2H3" />
			<Circle cx={7} cy={17} r={1.8} />
			<Circle cx={16.5} cy={17} r={1.8} />
		</>
	),
}

export function ServiceIcon({ code, size = 24, color, strokeWidth = 2 }: { code: ServiceCode; size?: number; color: string; strokeWidth?: number }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			{SERVICE_ICONS[code] ?? SERVICE_ICONS.CAR_REPAIR}
		</Svg>
	)
}

/** Rounded square with the icon — 40 on tiles, 36 on cards [33, 37, 39]. */
export function ServiceBadge({ code, size = 36, radius = 10, active = false }: { code: ServiceCode; size?: number; radius?: number; active?: boolean }) {
	const c = useColors()
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: radius,
				backgroundColor: active ? c.brand : c.brandTint,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<ServiceIcon code={code} size={size * 0.55} color={active ? '#FFFFFF' : c.brandStrong} strokeWidth={2.2} />
		</View>
	)
}

/** A 3-column tile [33, 38]: icon badge + name; selected — brand outline and a filled badge. */
export function ServiceTile({ type, selected, onPress, height = 92 }: { type: ServiceType; selected: boolean; onPress: () => void; height?: number }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				flex: 1,
				height,
				borderRadius: 14,
				backgroundColor: selected ? c.brandTint : c.card,
				borderWidth: 2,
				borderColor: selected ? c.brand : 'transparent',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 8,
				paddingHorizontal: 6,
			}}
		>
			<ServiceBadge code={type.code} size={40} radius={12} active={selected} />
			<Text
				style={{
					fontSize: 12.5,
					lineHeight: 14.4,
					fontFamily: fontFamily(selected ? 700 : 600),
					color: selected ? c.brandStrong : c.ink,
					textAlign: 'center',
				}}
			>
				{type.name}
			</Text>
		</Pressable>
	)
}

/** 3-per-row grid of tiles. */
export function ServiceGrid({
	types,
	isSelected,
	onPress,
	tileHeight,
}: {
	types: ServiceType[]
	isSelected: (code: ServiceCode) => boolean
	onPress: (code: ServiceCode) => void
	tileHeight?: number
}) {
	const rows: ServiceType[][] = []
	for (let i = 0; i < types.length; i += 3) rows.push(types.slice(i, i + 3))
	return (
		<View style={{ gap: 8 }}>
			{rows.map((row) => (
				<View key={row[0].code} style={{ flexDirection: 'row', gap: 8 }}>
					{row.map((type) => (
						<ServiceTile key={type.code} type={type} selected={isSelected(type.code)} onPress={() => onPress(type.code)} height={tileHeight} />
					))}
					{row.length < 3 ? Array.from({ length: 3 - row.length }, (_, i) => <View key={i} style={{ flex: 1 }} />) : null}
				</View>
			))}
		</View>
	)
}

/** Four bars + «Шаг 2 из 4 · Машина» [33–36]. */
export function WizardStepper({ step, total = 4, label }: { step: number; total?: number; label: string }) {
	const c = useColors()
	return (
		<View style={{ gap: 6 }}>
			<View style={{ flexDirection: 'row', gap: 6 }}>
				{Array.from({ length: total }, (_, i) => (
					<View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? c.brand : c.border }} />
				))}
			</View>
			<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
				Шаг {step} из {total} · {label}
			</Text>
		</View>
	)
}

export interface SummaryChip {
	key: string
	label: string
	/** Service icon or a brand logo. */
	icon?: ReactNode
}

/** What's already chosen, as small white pills [34–36]. */
export function SummaryChips({ items }: { items: SummaryChip[] }) {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
			{items.map((item) => (
				<View
					key={item.key}
					style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 6 }}
				>
					{item.icon}
					<Text style={{ fontSize: 12.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>{item.label}</Text>
				</View>
			))}
		</View>
	)
}

/** First attachment of a request [39]: photo, or a video (poster or a dark tile) with ▶; «+N» for the rest. */
function Media56({ url, video, more }: { url: string | null; video: boolean; more: number }) {
	return (
		<View
			style={{
				width: 56,
				height: 56,
				borderRadius: 8,
				overflow: 'hidden',
				backgroundColor: video ? '#2A2D33' : raw.fill,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{url ? <Image source={{ uri: resolveUrl(url) }} style={{ position: 'absolute', width: 56, height: 56 }} /> : null}
			{video ? (
				<View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
					<Text style={{ fontSize: 10, color: '#FFFFFF', marginLeft: 2 }}>▶</Text>
				</View>
			) : null}
			{more > 0 ? (
				<View style={{ position: 'absolute', right: 3, bottom: 3, paddingHorizontal: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.55)' }}>
					<Text style={{ fontSize: 10, fontFamily: fontFamily(700), color: '#FFFFFF' }}>+{more}</Text>
				</View>
			) : null}
		</View>
	)
}

/** A master's reply to the buyer [37]. */
export function OfferCard({
	name,
	avatarUrl,
	meta,
	price,
	when,
	message,
	onCall,
	onWrite,
	onOpen,
	onComplain,
}: {
	name: string
	avatarUrl: string | null
	/** «★ 4.9 · 212 отзывов · 2,1 км» */
	meta: string
	/** «от 1 500 с» */
	price: string | null
	/** «сегодня 15:00» */
	when: string | null
	message: string | null
	onCall?: () => void
	onWrite?: () => void
	/** Tap on the master — the profile. */
	onOpen?: () => void
	/** Long press — report the offer. */
	onComplain?: () => void
}) {
	const c = useColors()
	return (
		<Pressable
			onLongPress={onComplain}
			disabled={!onComplain}
			delayLongPress={450}
			style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}
		>
			<Pressable onPress={onOpen} disabled={!onOpen} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				{avatarUrl ? (
					<Image source={{ uri: resolveUrl(avatarUrl) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
				) : (
					<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.brandStrong }}>{name.replace(/^(СТО|Мастер)\s*«?/, '').slice(0, 1)}</Text>
					</View>
				)}
				<View style={{ flex: 1, gap: 2 }}>
					<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
						{name}
					</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{meta}</Text>
				</View>
				<View style={{ alignItems: 'flex-end', gap: 2 }}>
					{price ? <Text style={{ fontSize: 16, fontFamily: fontFamily(800), color: c.ink }}>{price}</Text> : null}
					{when ? <Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: c.success }}>{when}</Text> : null}
				</View>
			</Pressable>
			{message ? <Text style={{ fontSize: 14, lineHeight: 18.9, fontFamily: fontFamily(400), color: c.inkSecondary }}>{message}</Text> : null}
			<View style={{ flexDirection: 'row', gap: 8 }}>
				<Button label="Позвонить" variant="secondary" icon={PhoneIcon} height={44} style={{ flex: 1 }} disabled={!onCall} onPress={onCall} />
				<Button label="Написать" icon={ChatIcon} height={44} style={{ flex: 1.4 }} disabled={!onWrite} onPress={onWrite} />
			</View>
		</Pressable>
	)
}

/** A request in the master's feed [39]: service, car, text, distance, when, the two answers. */
export function ServiceRequestCard({
	code,
	title,
	carLabel,
	description,
	media,
	distance,
	when,
	answered,
	onHelp,
	onSkip,
	onOpenMedia,
}: {
	code: ServiceCode
	title: string
	carLabel: string
	description: string
	/** `media[]` of the request — photos and videos in order. */
	media: { kind: 'PHOTO' | 'VIDEO'; thumbUrl: string | null; url: string }[]
	/** «2,1 км» */
	distance: string | null
	/** «сегодня · ещё 16 мин» */
	when: string
	/** Already answered — the buttons give way to a note. */
	answered: string | null
	onHelp: () => void
	onSkip: () => void
	/** Tap on the attachment — the full-screen viewer. */
	onOpenMedia?: () => void
}) {
	const c = useColors()
	return (
		<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<ServiceBadge code={code} />
				<View style={{ flex: 1, gap: 1 }}>
					<Text numberOfLines={1} style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>
						{title}
					</Text>
					<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						{carLabel}
					</Text>
				</View>
			</View>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
				{media[0] ? (
					<Pressable onPress={onOpenMedia} disabled={!onOpenMedia}>
						<Media56
							url={media[0].kind === 'VIDEO' ? media[0].thumbUrl : (media[0].thumbUrl ?? media[0].url)}
							video={media[0].kind === 'VIDEO'}
							more={media.length - 1}
						/>
					</Pressable>
				) : null}
				<Text style={{ flex: 1, fontSize: 13, lineHeight: 17.5, fontFamily: fontFamily(400), color: c.inkSecondary }}>{description}</Text>
			</View>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
				{distance ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
						<MapPinIcon size={14} color={c.muted} strokeWidth={2} />
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{distance}</Text>
					</View>
				) : (
					<View />
				)}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
					<ClockIcon size={14} color={c.muted} strokeWidth={2} />
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{when}</Text>
				</View>
			</View>
			{answered ? (
				<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.muted, textAlign: 'center', paddingVertical: 12 }}>{answered}</Text>
			) : (
				<View style={{ flexDirection: 'row', gap: 8 }}>
					<Button label="Могу помочь" height={44} style={{ flex: 1.5 }} onPress={onHelp} />
					<Button label="Не моё" variant="secondary" height={44} style={{ flex: 1 }} onPress={onSkip} />
				</View>
			)}
		</View>
	)
}
