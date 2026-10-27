// Building blocks of the v23 buyer screens [01–10]: the design's icons, top bar, section caps,
// big buttons and small chips. Sizes and colours are taken from the v23 mockup one to one.
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { router } from 'expo-router'
import { fontFamily, useColors } from '@/theme'

// ─── Icons (24×24 strokes from the mockup) ──────────────────────────────────

interface V23IconProps {
	size?: number
	color: string
	strokeWidth?: number
}

function Stroke({ size = 24, color, strokeWidth = 2.2, children }: V23IconProps & { children: ReactNode }) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{children}
		</Svg>
	)
}

export const BackIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.4} {...p}>
		<Path d="M15 5 8 12l7 7" />
	</Stroke>
)
export const CrossIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.4} {...p}>
		<Path d="M6 6l12 12M18 6 6 18" />
	</Stroke>
)
export const ChevronIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.2} {...p}>
		<Path d="m9 6 6 6-6 6" />
	</Stroke>
)
export const LoupeIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Circle cx="11" cy="11" r="7" />
		<Path d="m20 20-4-4" />
	</Stroke>
)
export const TickIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={3} {...p}>
		<Path d="m5 12.5 4.5 4.5L19 7.5" />
	</Stroke>
)
export const BoxOutlineIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z" />
		<Path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" />
	</Stroke>
)
export const WrenchIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.3 2.3-2.3-.7-.7-2.3z" />
	</Stroke>
)
export const WheelIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Circle cx="12" cy="12" r="8.5" />
		<Circle cx="12" cy="12" r="3.5" />
		<Path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" />
	</Stroke>
)
export const TowIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M2.5 16V9h6l2 3h4.5l6 4v1.5H2.5z" />
		<Circle cx="6.5" cy="17.5" r="1.8" />
		<Circle cx="17" cy="17.5" r="1.8" />
		<Path d="M14 12 20 5" />
	</Stroke>
)
export const PlusThinIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.4} {...p}>
		<Path d="M12 5v14M5 12h14" />
	</Stroke>
)
export const PaperPlaneIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.4} {...p}>
		<Path d="M21 3 3 10.5l7.5 3 3 7.5z" />
	</Stroke>
)
export const MicV23Icon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.4} {...p}>
		<Rect x="9" y="3" width="6" height="11" rx="3" />
		<Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
	</Stroke>
)
export const PassportIcon = (p: V23IconProps) => (
	<Stroke strokeWidth={2.1} {...p}>
		<Rect x="3.5" y="5" width="17" height="14" rx="2.5" />
		<Circle cx="9" cy="11" r="2.2" />
		<Path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14 9.5h4M14 13h4" />
	</Stroke>
)
export const CallIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
	</Stroke>
)
export const BubbleIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" />
	</Stroke>
)
export const RouteIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Circle cx="6" cy="18" r="2.5" />
		<Circle cx="18" cy="6" r="2.5" />
		<Path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
	</Stroke>
)
export const CameraV23Icon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.5-2h4.4l1.5 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
		<Circle cx="12" cy="12.5" r="3.5" />
	</Stroke>
)
export const GlobeIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Circle cx="12" cy="12" r="8.5" />
		<Path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
	</Stroke>
)
export const BellIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
		<Path d="M10 20.5a2 2 0 0 0 4 0" />
	</Stroke>
)
export const HelpIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Circle cx="12" cy="12" r="8.5" />
		<Path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.5M12 17h.01" />
	</Stroke>
)
export const SwapIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
	</Stroke>
)
export const DotsIcon = (p: V23IconProps) => (
	<Stroke {...p}>
		<Circle cx="5" cy="12" r="1" />
		<Circle cx="12" cy="12" r="1" />
		<Circle cx="19" cy="12" r="1" />
	</Stroke>
)

// ─── Layout ──────────────────────────────────────────────────────────────────

/**
 * 52px bar under the status bar: ‹ back, title (20px / 700; 26px for big titles), right slot.
 * `onClose` instead of `onBack` puts × on the right, as on «Найти запчасть» [04].
 */
export function TopBar({
	title,
	big,
	onBack,
	onClose,
	right,
}: {
	title?: string
	big?: boolean
	onBack?: (() => void) | false
	onClose?: () => void
	right?: ReactNode
}) {
	const c = useColors()
	return (
		<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			{onBack !== false && !onClose ? (
				<Pressable onPress={onBack || (() => router.back())} hitSlop={10}>
					<BackIcon color={c.ink} />
				</Pressable>
			) : null}
			<Text
				numberOfLines={1}
				style={{ flex: 1, fontSize: big ? 26 : 20, fontFamily: fontFamily(700), letterSpacing: big ? -0.26 : -0.2, color: c.ink }}
			>
				{title ?? ''}
			</Text>
			{right}
			{onClose ? (
				<Pressable onPress={onClose} hitSlop={10}>
					<CrossIcon color={c.ink} />
				</Pressable>
			) : null}
		</View>
	)
}

/** «НУЖЕН МАСТЕР?» — 13px / 700, letter-spacing .08em, uppercase; optional link on the right. */
export function Caps({ children, link, onLink }: { children: string; link?: string; onLink?: () => void }) {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			<Text style={{ flex: 1, fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
				{children.toUpperCase()}
			</Text>
			{link ? (
				<Text onPress={onLink} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
					{link}
				</Text>
			) : null}
		</View>
	)
}

/** 56–58px main button: blue action or green «Есть / Позвонить». */
export function BigButton({
	label,
	onPress,
	tone = 'blue',
	icon,
	height = 56,
	loading,
	disabled,
	style,
}: {
	label: string
	onPress?: () => void
	tone?: 'blue' | 'green' | 'grey'
	icon?: ReactNode
	height?: number
	loading?: boolean
	disabled?: boolean
	style?: StyleProp<ViewStyle>
}) {
	const c = useColors()
	const background = tone === 'green' ? c.success : tone === 'grey' ? '#EFEDEC' : c.brand
	const color = tone === 'grey' ? c.ink : '#FFFFFF'
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={[
				{
					height,
					borderRadius: 14,
					backgroundColor: background,
					opacity: disabled ? 0.45 : 1,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 8,
				},
				style,
			]}
		>
			{loading ? <ActivityIndicator color={color} /> : icon}
			<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color }}>{label}</Text>
		</Pressable>
	)
}

/** 26px chip: «3 есть · от 2 900 с», «Новые», «Пара». */
export function MetaChip({ label, tone = 'grey' }: { label: string; tone?: 'green' | 'grey' }) {
	const c = useColors()
	return (
		<View
			style={{
				height: 26,
				paddingHorizontal: 9,
				borderRadius: 8,
				backgroundColor: tone === 'green' ? '#E7F6EC' : c.surface,
				justifyContent: 'center',
			}}
		>
			<Text style={{ fontSize: 14.5, fontFamily: fontFamily(600), color: tone === 'green' ? c.success : c.ink }}>{label}</Text>
		</View>
	)
}

/** Green dot with a halo — «Ищем ещё 18 мин». */
export function LiveDot() {
	const c = useColors()
	return (
		<View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#E7F6EC', alignItems: 'center', justifyContent: 'center' }}>
			<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success }} />
		</View>
	)
}

/** The illustration of a part used in the mockup when there is no photo (strut on a grey gradient). */
export function PartIllustration({ size }: { size: number }) {
	return (
		<View style={{ width: size, height: size, backgroundColor: '#E1E6ED' }}>
			<Svg viewBox="0 0 100 100" width={size} height={size}>
				<Rect x="42" y="12" width="16" height="30" rx="4" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2" />
				<Path d="M36 44h28M38 50l24 5M38 58l24 5M38 66l24 5M38 74l24 5" stroke="#374151" strokeWidth="3.5" strokeLinecap="round" />
				<Rect x="40" y="46" width="20" height="44" rx="5" fill="#EAB308" stroke="#A16207" strokeWidth="2" opacity={0.9} />
				<Circle cx="50" cy="93" r="4" fill="#6B7280" />
			</Svg>
		</View>
	)
}

/** «3 200» — price with a thin space, as in the mockup. */
export function priceDigits(value: number) {
	return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** «Новые», «Б/у», «Под заказ» — chips under the price [05]. */
export const CONDITION_CHIP = { NEW: 'Новые', USED: 'Б/у', ON_ORDER: 'Под заказ' } as const

/** Chips of a «Есть» answer: condition, «Оригинал KYB» / «Копия», then the rest of the tags [05]. */
export function replyChips(reply: {
	condition: 'NEW' | 'USED' | 'ON_ORDER' | null
	original: boolean | null
	manufacturer: string | null
	tags: string[]
}) {
	const chips: string[] = []
	if (reply.condition) chips.push(CONDITION_CHIP[reply.condition])
	const maker = reply.manufacturer ? ` ${reply.manufacturer}` : ''
	if (reply.original === true) chips.push(`Оригинал${maker}`)
	else if (reply.original === false) chips.push(`Копия${maker}`)
	else if (reply.manufacturer) chips.push(reply.manufacturer)
	return [...chips, ...reply.tags]
}
