import type { ReactNode } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontFamily, raw, useColors } from '@/theme'
import { haptic } from '@/lib/haptics'
import { t } from '@/i18n'

export { Button } from './button'
export { Chip } from './chip'
export { Badge } from './badge'
export { BrandChip, BrandLogo } from './brand'
export { PhotoPlaceholder } from './photo'
export { ProductCard } from './product-card'
export { EmptyState, NoticeBanner, QueryErrorBanner } from './notice'
export { BottomSheet } from './sheet'
export { toast } from './toast'
export { MoreButton } from './more-button'
export {
	Skeleton,
	SkeletonCard,
	SkeletonOfferCard,
	SkeletonProductGrid,
	SkeletonRepeat,
	SkeletonRequestCard,
	SkeletonRow,
	SkeletonStatus,
	SkeletonText,
} from './skeleton'

interface ScreenProps {
	children: ReactNode
	/** Фон экрана; по умолчанию surface из токенов. */
	background?: string
	/** Горизонтальные поля экрана (в макете 16). */
	padding?: number
	style?: StyleProp<ViewStyle>
}

/** Экран 390×844: safe area сверху вместо строки «9:41» из макета. */
export function Screen({ children, background, padding = 16, style }: ScreenProps) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	return (
		<View
			style={[
				{ flex: 1, backgroundColor: background ?? c.surface, paddingTop: insets.top, paddingHorizontal: padding },
				style,
			]}
		>
			{children}
		</View>
	)
}

export function Card({
	children,
	style,
	padding = 16,
	radius = 16,
	borderColor,
}: {
	children?: ReactNode
	style?: StyleProp<ViewStyle>
	padding?: number
	radius?: number
	borderColor?: string
}) {
	const c = useColors()
	return (
		<View
			style={[
				{
					backgroundColor: c.card,
					borderRadius: radius,
					padding,
				},
				borderColor ? { borderWidth: 2, borderColor } : null,
				style,
			]}
		>
			{children}
		</View>
	)
}

/** Overline-заголовок секции: 13px, weight 700, letterSpacing .08em, uppercase. */
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
	const c = useColors()
	return (
		<View style={style}>
			<Text
				style={{
					fontSize: 14.5,
					fontFamily: fontFamily(700),
					letterSpacing: 1.04,
					textTransform: 'uppercase',
					color: c.muted,
				}}
			>
				{children}
			</Text>
		</View>
	)
}

interface SegmentedProps {
	items: string[]
	value: number
	onChange: (index: number) => void
	background?: string
	borderColor?: string
	height?: number
	itemHeight?: number
	/** Inner padding and gap between items — 4 by default; the v2 screens [06б, 31] use 3 / 0. */
	padding?: number
	gap?: number
	/** Weight of the active label — 700 by default; 600 on the v2 screens. */
	activeWeight?: 600 | 700
	/** Colour of inactive labels — inkSecondary by default; muted on the v2 screens. */
	inactiveColor?: string
}

export function Segmented({
	items,
	value,
	onChange,
	background,
	borderColor,
	height = 56,
	itemHeight = 44,
	padding = 4,
	gap = 4,
	activeWeight = 700,
	inactiveColor,
}: SegmentedProps) {
	const c = useColors()
	return (
		<View
			style={{
				height,
				flexDirection: 'row',
				gap,
				padding,
				borderRadius: 12,
				backgroundColor: background ?? c.card,
				borderWidth: borderColor ? 2 : 0,
				borderColor,
			}}
		>
			{items.map((label, i) => {
				const active = i === value
				return (
					<Pressable
						key={label}
						onPress={() => {
							if (i !== value) haptic.select()
							onChange(i)
						}}
						style={{
							flex: 1,
							height: itemHeight,
							borderRadius: 9,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: active ? c.brand : 'transparent',
						}}
					>
						<Text
							style={{
								fontSize: 15.5,
								fontFamily: fontFamily(active ? activeWeight : 600),
								color: active ? '#FFFFFF' : (inactiveColor ?? c.inkSecondary),
							}}
						>
							{label}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

export function Toggle({ value, onChange }: { value: boolean; onChange?: (next: boolean) => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={() => {
				haptic.select()
				onChange?.(!value)
			}}
			accessibilityRole="switch"
			accessibilityState={{ checked: value }}
			style={{
				width: 44,
				height: 28,
				borderRadius: 14,
				backgroundColor: value ? c.success : raw.toggleOff,
				justifyContent: 'center',
			}}
		>
			<View
				style={{
					width: 22,
					height: 22,
					borderRadius: 11,
					backgroundColor: value ? c.surface : raw.toggleOffKnob,
					marginLeft: value ? 19 : 3,
				}}
			/>
		</Pressable>
	)
}

/** Строка списка в карточке профиля: 56px, подпись справа, разделитель цвета surface. */
export function SettingsRow({
	label,
	labelColor,
	value,
	valueColor,
	valueWeight = 400,
	height = 56,
	divider = true,
	right,
	onPress,
}: {
	label: string
	labelColor?: string
	value?: string
	valueColor?: string
	valueWeight?: 400 | 700
	height?: number
	divider?: boolean
	right?: ReactNode
	onPress?: () => void
}) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				height,
				paddingHorizontal: 16,
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				borderBottomWidth: divider ? 2 : 0,
				borderBottomColor: c.surface,
			}}
		>
			<Text style={{ fontSize: 17.5, fontFamily: fontFamily(400), color: labelColor ?? c.ink }}>{label}</Text>
			{right ??
				(value ? (
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(valueWeight), color: valueColor ?? c.muted }}>
						{value}
					</Text>
				) : null)}
		</Pressable>
	)
}

/** Переключатель языка Русский / Кыргызча из настроек. */
export function LanguageSwitch({ value, onChange }: { value: 'ru' | 'kg'; onChange: (next: 'ru' | 'kg') => void }) {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', gap: 3, padding: 3, borderRadius: 10, backgroundColor: c.surface }}>
			{(['ru', 'kg'] as const).map((code) => {
				const active = value === code
				return (
					<Pressable
						key={code}
						onPress={() => onChange(code)}
						style={{
							height: 34,
							paddingHorizontal: 12,
							borderRadius: 8,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: active ? c.brand : 'transparent',
						}}
					>
						<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>
							{code === 'ru' ? t('Русский') : t('Кыргызча')}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

/** Карточка «РЯД / КОНТЕЙНЕР» с крупными цифрами — экраны 22 и 30. */
export function LocationCard({
	rowLabel,
	boxLabel,
	style,
}: {
	rowLabel: string
	boxLabel: string
	style?: StyleProp<ViewStyle>
}) {
	const c = useColors()
	const cell = (title: string, value: string) => (
		<View style={{ flex: 1, borderRadius: 12, backgroundColor: c.surface, paddingVertical: 8, paddingHorizontal: 12, gap: 2 }}>
			<Text style={{ fontSize: 12, fontFamily: fontFamily(700), letterSpacing: 0.88, color: c.muted }}>{title}</Text>
			<Text style={{ fontSize: 26, lineHeight: 29.9, fontFamily: fontFamily(800), color: c.ink }}>{value}</Text>
		</View>
	)
	return (
		<View style={[{ flexDirection: 'row', gap: 12 }, style]}>
			{cell(t('РЯД'), rowLabel)}
			{cell(t('КОНТЕЙНЕР'), boxLabel)}
		</View>
	)
}

/** Шаг количества «−  N  +» — экран 26. */
export function Stepper({
	value,
	onChange,
	min = 1,
	max = 99,
}: {
	value: number
	onChange: (next: number) => void
	min?: number
	max?: number
}) {
	const c = useColors()
	const step = (label: string, onPress: () => void, disabled: boolean) => (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={{
				width: 36,
				height: 36,
				borderRadius: 10,
				backgroundColor: c.surface,
				alignItems: 'center',
				justifyContent: 'center',
				opacity: disabled ? 0.4 : 1,
			}}
		>
			<Text style={{ fontSize: 20, fontFamily: fontFamily(400), color: c.ink }}>{label}</Text>
		</Pressable>
	)
	return (
		<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
			{step('−', () => onChange(Math.max(min, value - 1)), value <= min)}
			<Text style={{ fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>{value}</Text>
			{step('+', () => onChange(Math.min(max, value + 1)), value >= max)}
		</View>
	)
}

export function Avatar({
	letter,
	size = 52,
	radius = 14,
	color,
	fontSize = 20,
}: {
	letter: string
	size?: number
	radius?: number
	color?: string
	fontSize?: number
}) {
	const c = useColors()
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: radius,
				backgroundColor: c.card,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Text style={{ fontSize, fontFamily: fontFamily(700), color: color ?? c.brandStrong }}>{letter}</Text>
		</View>
	)
}
export { ServiceBadge, ServiceGrid, ServiceIcon, ServiceTile } from './service'
