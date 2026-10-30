// Иконки перенесены из макета как есть: viewBox 24, те же path и толщины обводки.
import Svg, { Circle, Path, Rect } from 'react-native-svg'

export interface IconProps {
	size?: number
	color: string
	strokeWidth?: number
}

const base = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24' })

export function HomeIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M3 10.5 12 3l9 7.5" />
			<Path d="M5 9.5V20h5v-6h4v6h5V9.5" />
		</Svg>
	)
}

export function RequestsIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Rect x={5} y={3} width={14} height={18} rx={2.5} />
			<Path d="M9 8h6M9 12h6M9 16h3" />
		</Svg>
	)
}

export function MarketIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" />
			<Path d="M9 4v14M15 6v14" />
		</Svg>
	)
}

export function ChatIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" />
		</Svg>
	)
}

export function ProfileIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Circle cx={12} cy={8} r={4} />
			<Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
		</Svg>
	)
}

export function StatsIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M4 20h16" />
			<Rect x={5.5} y={12} width={3} height={5.5} rx={1} />
			<Rect x={10.5} y={7} width={3} height={10.5} rx={1} />
			<Rect x={15.5} y={4} width={3} height={13.5} rx={1} />
		</Svg>
	)
}

export function BoxIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z" />
			<Path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" />
		</Svg>
	)
}

export function SearchIcon({ size, color, strokeWidth = 2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
			<Circle cx={11} cy={11} r={7} />
			<Path d="m20 20-4-4" />
		</Svg>
	)
}

export function ChevronLeftIcon({ size, color, strokeWidth = 2.4 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M15 5 8 12l7 7" />
		</Svg>
	)
}

export function CameraIcon({ size, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
			<Path d="M3 7h4l2-2h6l2 2h4v12H3z" />
			<Circle cx={12} cy={13} r={3.4} />
		</Svg>
	)
}

export function StoreIcon({ size, color, strokeWidth = 2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
			<Path d="M4 9h16v11H4z" />
			<Path d="M4 9 6 4h12l2 5" />
			<Path d="M10 20v-5h4v5" />
		</Svg>
	)
}

export function SendIcon({ size, color, strokeWidth = 2.6 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M5 12h14" />
			<Path d="m13 6 6 6-6 6" />
		</Svg>
	)
}

export function MicIcon({ size, color, strokeWidth = 2.4 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
			<Rect x={9} y={3} width={6} height={12} rx={3} />
			<Path d="M5 11a7 7 0 0 0 14 0" />
			<Path d="M12 18v3" />
		</Svg>
	)
}

export function CheckIcon({ size, color, strokeWidth = 3 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="m5 13 4 4 10-10" />
		</Svg>
	)
}

export function LocateIcon({ size, color }: IconProps) {
	return (
		<Svg {...base(size)} fill={color}>
			<Path d="M21 3 3 10.5l7.5 3 3 7.5z" />
		</Svg>
	)
}

export function CloseIcon({ size, color, strokeWidth = 2.6 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
			<Path d="M6 6l12 12M18 6 6 18" />
		</Svg>
	)
}

export function FlashIcon({ size, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M13 3 6 13h5l-1 8 7-10h-5z" />
		</Svg>
	)
}

export function ShareIcon({ size, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M12 3v12M7 8l5-5 5 5" />
			<Path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
		</Svg>
	)
}

/** «В избранное» [29, 30] — not in the mockup set; drawn in the same stroke style. */
export function HeartIcon({ size, color, strokeWidth = 2.2, filled }: IconProps & { filled?: boolean }) {
	return (
		<Svg {...base(size)} fill={filled ? color : 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
		</Svg>
	)
}

export function PhoneIcon({ size, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
		</Svg>
	)
}

export function MapPinIcon({ size, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
			<Circle cx={12} cy={9.5} r={2.5} />
		</Svg>
	)
}

export function GalleryIcon({ size, color, strokeWidth = 2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Rect x={3.5} y={4.5} width={17} height={15} rx={2.5} />
			<Circle cx={9} cy={10} r={1.8} />
			<Path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
		</Svg>
	)
}

export function PlusIcon({ size, color, strokeWidth = 2.8 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
			<Path d="M12 5v14M5 12h14" />
		</Svg>
	)
}

export function TagIcon({ size, color, strokeWidth = 1.9 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M3.5 12.2 11 4.7a2 2 0 0 1 1.4-.6H19a1 1 0 0 1 1 1v6.6a2 2 0 0 1-.6 1.4l-7.5 7.5a1.5 1.5 0 0 1-2.1 0l-6.3-6.3a1.5 1.5 0 0 1 0-2.1z" />
			<Circle cx={15.5} cy={8.5} r={1.5} />
		</Svg>
	)
}

/** Camera of the v2 screens [06б] — a slightly different outline than CameraIcon. */
export function PhotoIcon({ size, color, strokeWidth = 2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
			<Circle cx={12} cy={13} r={3.5} />
		</Svg>
	)
}

export function ClockIcon({ size, color, strokeWidth = 2.2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Circle cx={12} cy={12} r={8.5} />
			<Path d="M12 7.5V12l3 2" />
		</Svg>
	)
}

export function FlagIcon({ size, color, strokeWidth = 2 }: IconProps) {
	return (
		<Svg {...base(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			<Path d="M5 21V4M5 4h11l-2 4 2 4H5" />
		</Svg>
	)
}

/** WhatsApp logo (filled) — «Написать в WhatsApp». */
export function WhatsAppIcon({ size, color }: IconProps) {
	return (
		<Svg {...base(size)} fill={color}>
			<Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
		</Svg>
	)
}
