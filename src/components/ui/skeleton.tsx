import { useEffect, useState, type ReactNode } from 'react'
import { useColorScheme, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
	cancelAnimation,
	Easing,
	makeMutable,
	useAnimatedStyle,
	useReducedMotion,
	withRepeat,
	withTiming,
} from 'react-native-reanimated'
import { useColors } from '@/theme'

/**
 * Скелетоны вместо спиннеров: серые блоки по форме будущего контента с бликом, который пробегает слева направо.
 * Один общий таймер на все блоки — блики на экране идут в такт; крутится, только пока на экране есть скелетон.
 */

const progress = makeMutable(0)
let mounted = 0

function useShimmerClock(enabled: boolean) {
	useEffect(() => {
		if (!enabled) return
		if (mounted++ === 0) {
			progress.value = 0
			progress.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, false)
		}
		return () => {
			if (--mounted === 0) cancelAnimation(progress)
		}
	}, [enabled])
}

export function Skeleton({
	width = '100%',
	height = 14,
	radius = 8,
	onDark,
	style,
}: {
	width?: DimensionValue
	height?: DimensionValue
	radius?: number
	/** На тёмной подложке (видеолента) — полупрозрачный белый вместо hairline. */
	onDark?: boolean
	style?: StyleProp<ViewStyle>
}) {
	const c = useColors()
	const dark = useColorScheme() === 'dark' || onDark
	const still = useReducedMotion()
	const [w, setW] = useState(0)
	useShimmerClock(!still)

	const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: -w + progress.value * w * 2 }] }))
	const glare = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)'

	return (
		<View
			onLayout={(e) => setW(e.nativeEvent.layout.width)}
			style={[{ width, height, borderRadius: radius, backgroundColor: onDark ? 'rgba(255,255,255,0.14)' : c.hairline, overflow: 'hidden' }, style]}
		>
			{!still && w > 0 ? (
				<Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: w }, sweep]}>
					<LinearGradient
						colors={['transparent', glare, 'transparent']}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={{ flex: 1 }}
					/>
				</Animated.View>
			) : null}
		</View>
	)
}

/** Абзац: `lines` строк, последняя короче. */
export function SkeletonText({ lines = 2, height = 14, gap = 8, last = '60%' }: { lines?: number; height?: number; gap?: number; last?: DimensionValue }) {
	return (
		<View style={{ gap }}>
			{Array.from({ length: lines }, (_, i) => (
				<Skeleton key={i} height={height} width={i === lines - 1 && lines > 1 ? last : '100%'} />
			))}
		</View>
	)
}

/** `count` копий заготовки — для списков. Строки ниже чуть бледнее, чтобы список «растворялся». */
export function SkeletonRepeat({ count, gap = 0, children }: { count: number; gap?: number; children: ReactNode }) {
	return (
		<View style={{ gap }} accessibilityLabel="loading" accessibilityState={{ busy: true }}>
			{Array.from({ length: count }, (_, i) => (
				<View key={i} style={{ opacity: Math.max(0.35, 1 - i * 0.12) }}>
					{children}
				</View>
			))}
		</View>
	)
}

/** Строка списка: квадратный аватар и две-три строки текста (чаты, магазины, заявки). */
export function SkeletonRow({ avatar = 52, lines = 2, divider = true }: { avatar?: number; lines?: 2 | 3; divider?: boolean }) {
	const c = useColors()
	return (
		<View
			style={{
				paddingVertical: 14,
				paddingHorizontal: 16,
				flexDirection: 'row',
				gap: 12,
				alignItems: 'center',
				borderBottomWidth: divider ? 2 : 0,
				borderBottomColor: c.hairline,
			}}
		>
			{avatar ? <Skeleton width={avatar} height={avatar} radius={14} /> : null}
			<View style={{ flex: 1, gap: 9 }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 24 }}>
					<Skeleton width="55%" height={16} />
					<Skeleton width={40} height={12} />
				</View>
				<Skeleton width="85%" height={13} />
				{lines === 3 ? <Skeleton width="40%" height={13} /> : null}
			</View>
		</View>
	)
}

/** Карточка на `card`-подложке: заголовок и абзац (заявки, ответы, заказы). */
export function SkeletonCard({ lines = 2, media, style }: { lines?: number; media?: boolean; style?: StyleProp<ViewStyle> }) {
	const c = useColors()
	return (
		<View style={[{ backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 14 }, style]}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				{media ? <Skeleton width={56} height={56} radius={12} /> : null}
				<View style={{ flex: 1, gap: 8 }}>
					<Skeleton width="65%" height={17} />
					<Skeleton width="35%" height={12} />
				</View>
			</View>
			{lines > 0 ? <SkeletonText lines={lines} height={13} /> : null}
		</View>
	)
}

/** Сетка товаров в две колонки — как ProductCard: квадратное фото, цена, название, магазин. */
export function SkeletonProductGrid({ rows = 2, gap = 12 }: { rows?: number; gap?: number }) {
	return (
		<SkeletonRepeat count={rows} gap={20}>
			<View style={{ flexDirection: 'row', gap }}>
				{[0, 1].map((i) => (
					<View key={i} style={{ flex: 1, gap: 8 }}>
						<Skeleton height="auto" radius={16} style={{ aspectRatio: 1 }} />
						<Skeleton width="45%" height={18} />
						<Skeleton width="90%" height={13} />
						<Skeleton width="60%" height={12} />
					</View>
				))}
			</View>
		</SkeletonRepeat>
	)
}

/** Входящий запрос / заявка (RequestCard продавца и мастера): марка, клиент, текст, кнопки ответа. `full` — с большим фото. */
export function SkeletonRequestCard({ full, actions = 1 }: { full?: boolean; actions?: 1 | 2 }) {
	const c = useColors()
	return (
		<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 12 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Skeleton width={36} height={36} radius={18} />
				<View style={{ flex: 1, gap: 7 }}>
					<Skeleton width="50%" height={16} />
					<Skeleton width="35%" height={13} />
				</View>
			</View>
			<SkeletonText lines={2} height={16} />
			{full ? <Skeleton height={220} radius={14} /> : null}
			<View style={{ flexDirection: 'row', gap: 8 }}>
				{Array.from({ length: actions }, (_, i) => (
					<Skeleton key={i} width="auto" height={44} radius={12} style={{ flex: 1 }} />
				))}
			</View>
		</View>
	)
}

/** Плашка статуса запроса: точка-индикатор, «Ищем ещё N минут», «Спросили … · ответили …». */
export function SkeletonStatus() {
	const c = useColors()
	return (
		<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			<Skeleton width={20} height={20} radius={10} />
			<View style={{ flex: 1, gap: 8 }}>
				<Skeleton width="50%" height={16} />
				<Skeleton width="75%" height={13} />
			</View>
		</View>
	)
}

/** Ответ продавца / отклик мастера: аватар, имя и место, цена, чипы, кнопки «Позвонить» · чат. */
export function SkeletonOfferCard() {
	const c = useColors()
	return (
		<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 12 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				<Skeleton width={44} height={44} radius={22} />
				<View style={{ flex: 1, gap: 7 }}>
					<Skeleton width="55%" height={16} />
					<Skeleton width="40%" height={13} />
				</View>
				<Skeleton width={70} height={24} />
			</View>
			<View style={{ flexDirection: 'row', gap: 6 }}>
				<Skeleton width={70} height={26} radius={13} />
				<Skeleton width={90} height={26} radius={13} />
			</View>
			<View style={{ flexDirection: 'row', gap: 8 }}>
				<Skeleton width="auto" height={46} radius={12} style={{ flex: 1 }} />
				<Skeleton width={46} height={46} radius={12} />
				<Skeleton width={46} height={46} radius={12} />
			</View>
		</View>
	)
}
