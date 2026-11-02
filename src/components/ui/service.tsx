import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import type { ServiceType } from '@/api/types'

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
			<ServiceIcon code={code} size={size * 0.55} color={active ? fixed.white : c.brandStrong} strokeWidth={2.2} />
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
					fontSize: fs.sm,
					lineHeight: 16,
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
