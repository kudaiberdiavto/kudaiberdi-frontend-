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
