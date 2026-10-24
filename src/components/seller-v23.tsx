// Seller screens of v23 [11, 13–15]: icons and small pieces drawn exactly as in the mockup.
import { Pressable, Text, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { BrandLogo } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import type { Brand } from '@/api/types'

interface IconProps {
	size?: number
	color: string
	strokeWidth?: number
}

const stroke = (size: number, color: string, strokeWidth: number) => ({
	width: size,
	height: size,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: color,
	strokeWidth,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
})

/** ⚡ «Кто отвечает быстрее…» [13]. */
export function BoltIcon({ size = 18, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Path d="M13 3 6 13h5l-1 8 7-10h-5z" />
		</Svg>
	)
}

/** Microphone of «Ответить голосом» [13]. */
export function MicIcon({ size = 20, color, strokeWidth = 2.4 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Rect x={9} y={3} width={6} height={11} rx={3} />
			<Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
		</Svg>
	)
}

export function TickIcon({ size = 20, color, strokeWidth = 2.4 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Path d="m5 12.5 4.5 4.5L19 7.5" />
		</Svg>
	)
}

/** ✧ «из голоса» [14]. */
export function SparkleIcon({ size = 14, color, strokeWidth = 2 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z" />
			<Path d="M18.5 16v4M16.5 18h4" />
		</Svg>
	)
}

/** Paper plane of «Отправить покупателю» [14]. */
export function PlaneIcon({ size = 20, color, strokeWidth = 2.4 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Path d="M21 3 3 10.5l7.5 3 3 7.5z" />
		</Svg>
	)
}

export function BackIcon({ size = 24, color, strokeWidth = 2.4 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Path d="M15 5 8 12l7 7" />
		</Svg>
	)
}

export function PlusIcon({ size = 20, color, strokeWidth = 2.6 }: IconProps) {
	return (
		<Svg {...stroke(size, color, strokeWidth)}>
			<Path d="M12 5v14M5 12h14" />
		</Svg>
	)
}

/** The mockup's section caption: 13 px, 700, letter-spacing .08em, upper case. */
export function Label({ children, right }: { children: string; right?: React.ReactNode }) {
	const c = useColors()
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			<Text
				style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, textTransform: 'uppercase', color: c.muted }}
			>
				{children}
			</Text>
			{right ? (
				<>
					<View style={{ flex: 1 }} />
					{right}
				</>
			) : null}
		</View>
	)
}

/** «Открыт ●» [13] — the box toggle: green pill with a 40×24 switch; grey «Закрыт» when off. */
export function OpenPill({ open, onChange }: { open: boolean; onChange: (next: boolean) => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={() => onChange(!open)}
			style={{
				height: 36,
				paddingLeft: 12,
				paddingRight: 6,
				borderRadius: 18,
				backgroundColor: open ? '#E7F6EC' : c.hairline,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 8,
			}}
		>
			<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: open ? c.success : c.muted }}>
				{open ? 'Открыт' : 'Закрыт'}
			</Text>
			<View style={{ width: 40, height: 24, borderRadius: 12, backgroundColor: open ? c.success : '#BAB6B6' }}>
				<View
					style={{
						position: 'absolute',
						top: 3,
						left: open ? 19 : 3,
						width: 18,
						height: 18,
						borderRadius: 9,
						backgroundColor: '#FFFFFF',
					}}
				/>
			</View>
		</Pressable>
	)
}

/** Brand tile with a check [11]: three in a row. */
export function BrandTile({ brand, active, onPress }: { brand: Brand; active: boolean; onPress: () => void }) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				flexBasis: '31%',
				flexGrow: 1,
				borderRadius: 14,
				backgroundColor: active ? c.brandTint : c.card,
				borderWidth: 2,
				borderColor: active ? c.brand : c.border,
				paddingVertical: 10,
				paddingHorizontal: 4,
				alignItems: 'center',
				gap: 6,
			}}
		>
			<BrandLogo brand={brand} size={36} />
			<Text style={{ fontSize: 13, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>
				{brand.shortName}
			</Text>
			{active ? (
				<View
					style={{
						position: 'absolute',
						top: 6,
						right: 6,
						width: 18,
						height: 18,
						borderRadius: 9,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<TickIcon size={11} color="#FFFFFF" strokeWidth={3.2} />
				</View>
			) : null}
		</Pressable>
	)
}

/** «Toyota» pill with a 28 px logo [15]. */
export function BrandPill({ brand }: { brand: Brand }) {
	const c = useColors()
	return (
		<View
			style={{
				height: 40,
				paddingLeft: 6,
				paddingRight: 14,
				borderRadius: 20,
				backgroundColor: c.card,
				borderWidth: 2,
				borderColor: c.border,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 8,
			}}
		>
			<BrandLogo brand={brand} size={28} />
			<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.inkSecondary }}>{brand.shortName}</Text>
		</View>
	)
}
