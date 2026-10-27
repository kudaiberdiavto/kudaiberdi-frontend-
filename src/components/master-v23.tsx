// Shared pieces of the v23 service flow [16–20]: icons from the mockup, the green «Позвонить» row,
// the switch, the modal sheet and the time labels of a master's offer.
import { useEffect, type ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { fontFamily, useColors } from '@/theme'
import { formatClock, formatNumber } from '@/lib/format'

type IconProps = { size?: number; color: string; strokeWidth?: number }

function Outline({ size = 22, color, strokeWidth = 2.2, children }: IconProps & { children: ReactNode }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			{children}
		</Svg>
	)
}

export const CloseX = (p: IconProps) => (
	<Outline strokeWidth={2.4} {...p}>
		<Path d="M6 6l12 12M18 6 6 18" />
	</Outline>
)
export const BackChevron = (p: IconProps) => (
	<Outline strokeWidth={2.4} {...p}>
		<Path d="M15 5 8 12l7 7" />
	</Outline>
)
export const CameraOutline = (p: IconProps) => (
	<Outline {...p}>
		<Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
		<Circle cx={12} cy={13} r={3.5} />
	</Outline>
)
export const PinOutline = (p: IconProps) => (
	<Outline {...p}>
		<Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
		<Circle cx={12} cy={9.5} r={2.5} />
	</Outline>
)
export const SendPlane = (p: IconProps) => (
	<Outline strokeWidth={2.4} {...p}>
		<Path d="M21 3 3 10.5l7.5 3 3 7.5z" />
	</Outline>
)
export const MicOutline = (p: IconProps) => (
	<Outline strokeWidth={2.4} {...p}>
		<Rect x={9} y={3} width={6} height={11} rx={3} />
		<Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
	</Outline>
)
export const CheckMark = (p: IconProps) => (
	<Outline strokeWidth={2.4} {...p}>
		<Path d="m5 12.5 4.5 4.5L19 7.5" />
	</Outline>
)
export const PhoneOutline = (p: IconProps) => (
	<Outline strokeWidth={2.4} {...p}>
		<Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
	</Outline>
)
export const ChatBubble = (p: IconProps) => (
	<Outline {...p}>
		<Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" />
	</Outline>
)
export const RouteOutline = (p: IconProps) => (
	<Outline {...p}>
		<Circle cx={6} cy={18} r={2.5} />
		<Circle cx={18} cy={6} r={2.5} />
		<Path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
	</Outline>
)
export const MobileTruck = (p: IconProps) => (
	<Outline {...p}>
		<Path d="M3 16V8h10v8M13 11h4l3 3v2H3" />
		<Circle cx={7} cy={17} r={1.8} />
		<Circle cx={16.5} cy={17} r={1.8} />
	</Outline>
)
/** «✧» of fields filled from the voice note. */
export const Sparkle = ({ size = 13, color = '#5B3FD1' }: { size?: number; color?: string }) => (
	<Outline size={size} color={color} strokeWidth={2}>
		<Path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z" />
		<Path d="M18.5 16v4M16.5 18h4" />
	</Outline>
)

/** Violet «✧ из голоса» pill [19]. */
export function FromVoiceBadge() {
	return (
		<View style={{ height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#F1ECFF', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
			<Sparkle />
			<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#5B3FD1' }}>из голоса</Text>
		</View>
	)
}

/** The mockup's switch: green 40×24 (18) or 48×28 (20), white knob. */
export function Switch({ value, onChange, size = 'md', disabled }: { value: boolean; onChange: (next: boolean) => void; size?: 'sm' | 'md'; disabled?: boolean }) {
	const c = useColors()
	const w = size === 'sm' ? 40 : 48
	const h = size === 'sm' ? 24 : 28
	const knob = h - 6
	return (
		<Pressable
			disabled={disabled}
			onPress={() => onChange(!value)}
			hitSlop={8}
			style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: value ? c.success : '#BAB6B6', justifyContent: 'center' }}
		>
			<View style={{ width: knob, height: knob, borderRadius: knob / 2, backgroundColor: '#FFFFFF', marginLeft: value ? w - knob - 3 : 3 }} />
		</Pressable>
	)
}

/** Green «Позвонить» + chat + route squares [17]. */
export function CallRow({ onCall, onChat, onRoute }: { onCall?: () => void; onChat?: () => void; onRoute?: () => void }) {
	const c = useColors()
	const square = (icon: ReactNode, onPress?: () => void, tint: string = c.brandTint) => (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', opacity: onPress ? 1 : 0.5 }}
		>
			{icon}
		</Pressable>
	)
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
			<Pressable
				onPress={onCall}
				disabled={!onCall}
				style={{
					flex: 1,
					height: 48,
					borderRadius: 14,
					backgroundColor: c.success,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 8,
					opacity: onCall ? 1 : 0.5,
				}}
			>
				<PhoneOutline size={20} color="#FFFFFF" />
				<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Позвонить</Text>
			</Pressable>
			{/* «Написать» — green like «Позвонить» */}
			{square(<ChatBubble size={22} color={c.success} />, onChat, '#E7F6EC')}
			{square(<RouteOutline size={22} color={c.brandStrong} />, onRoute)}
		</View>
	)
}

/** Chip 26 px: green — time, grey — the master's note, red — «Срочно». */
export function SmallChip({ label, tone }: { label: string; tone: 'green' | 'grey' | 'red' }) {
	const c = useColors()
	const colors = { green: ['#E7F6EC', c.success], grey: [c.surface, c.ink], red: ['#FDECEC', c.danger] }[tone]
	return (
		<View style={{ height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: colors[0], justifyContent: 'center' }}>
			<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(600), color: colors[1] }}>
				{label}
			</Text>
		</View>
	)
}

/**
 * «Срочно» — SOS: solid red with a white dot, blinking (fades to 35 % and back, ~1 s) so an urgent request
 * stands out in the feed at a glance.
 */
export function UrgentChip({ label = 'Срочно' }: { label?: string }) {
	const c = useColors()
	const opacity = useSharedValue(1)
	useEffect(() => {
		opacity.value = withRepeat(withTiming(0.35, { duration: 500, easing: Easing.inOut(Easing.quad) }), -1, true)
		return () => cancelAnimation(opacity)
	}, [opacity])
	const blink = useAnimatedStyle(() => ({ opacity: opacity.value }))
	return (
		<Animated.View
			style={[
				{ height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: c.danger, flexDirection: 'row', alignItems: 'center', gap: 5 },
				blink,
			]}
		>
			<View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
			<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(700), color: '#FFFFFF' }}>
				{label}
			</Text>
		</Animated.View>
	)
}

/** Modal bottom sheet over a dimmed screen [19]: handle, 24 px corners, white. */
export function ModalSheet({ visible = true, onClose, children }: { visible?: boolean; onClose: () => void; children: ReactNode }) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={{ flex: 1, backgroundColor: 'rgba(32,31,29,0.45)' }} onPress={onClose} />
				<View
					style={{
						backgroundColor: c.card,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						paddingTop: 10,
						paddingHorizontal: 16,
						paddingBottom: 28 + insets.bottom,
						gap: 12,
					}}
				>
					<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />
					{children}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/**
 * When the master can [17, 18]: within 1,5 hours — «Через 20 мин» / «Через 1 час», today — «Сегодня в 15:00»,
 * tomorrow — «Завтра 10:00». `from` — the moment the offer was made.
 */
export function offerWhen(availableAt: string | null | undefined, from = new Date()): string | null {
	if (!availableAt) return null
	const at = new Date(availableAt)
	const minutes = Math.round((at.getTime() - from.getTime()) / 60_000)
	if (minutes <= 5) return 'Сейчас'
	if (minutes <= 90) return minutes >= 55 && minutes <= 65 ? 'Через 1 час' : `Через ${minutes} мин`
	if (sameDay(at, from)) return `Сегодня в ${formatClock(at)}`
	const tomorrow = new Date(from.getTime() + 86_400_000)
	if (sameDay(at, tomorrow)) return `Завтра ${formatClock(at)}`
	return `${at.getDate()}.${String(at.getMonth() + 1).padStart(2, '0')} ${formatClock(at)}`
}

/** «от 1 500 с · через 20 мин» — the master's own answer in the feed [18]. */
export function myOfferLine(priceFrom: number | null | undefined, availableAt: string | null | undefined, createdAt: string) {
	const when = offerWhen(availableAt, new Date(createdAt))
	return ['Вы ответили', priceFrom ? `от ${formatNumber(priceFrom)} с` : null, when ? when.charAt(0).toLowerCase() + when.slice(1) : null]
		.filter(Boolean)
		.join(' · ')
}
