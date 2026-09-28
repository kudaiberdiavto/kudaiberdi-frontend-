// Источник: design/tokens.json. Значения менять только вместе с макетом.

export const lightColors = {
	surface: '#F3F5F8',
	card: '#FFFFFF',
	ink: '#201F1D',
	inkSecondary: '#444141',
	muted: '#605D5D',
	border: '#D7D3D3',
	hairline: '#EAE7E7',
	brand: '#2155E6',
	brandStrong: '#1D46BF',
	brandTint: '#EDF2FF',
	success: '#15803D',
	successTint: 'rgba(21,128,61,0.10)',
	danger: '#B91C1C',
	dangerTint: 'rgba(185,28,28,0.08)',
}

export const darkColors: typeof lightColors = {
	surface: '#111317',
	card: '#1B1E24',
	ink: '#F2F3F5',
	inkSecondary: '#C9CCD2',
	muted: '#9BA0A8',
	border: '#353A43',
	hairline: '#262A31',
	brand: '#4C7BFF',
	brandStrong: '#8AA8FF',
	brandTint: '#1A2442',
	success: '#4ADE80',
	successTint: 'rgba(74,222,128,0.14)',
	danger: '#F87171',
	dangerTint: 'rgba(248,113,113,0.14)',
}

/** Цвета, встречающиеся только в макетах конкретных экранов (в tokens.json их нет). */
export const raw = {
	sheetBackdrop: '#E4E2E0',
	fill: '#EFEDEC',
	fillInk: '#7D7979',
	dashed: '#BAB6B6',
	toggleOff: '#BAB6B6',
	toggleOffKnob: '#9B9797',
	mapSurface: '#E6E9EE',
	mapRow: '#DCE3EE',
	mapRowBorder: '#B8C3D3',
	mapRowMuted: '#E8ECF2',
	mapRowMutedBorder: '#D6DCE5',
	mapPassage: '#FFE9A8',
	mapPassageEdge: '#E9CF86',
	mapShop: '#E4E2DE',
	mapShopBorder: '#CFCAC3',
	mapAdmin: '#E3DDF0',
	mapAdminBorder: '#C3B8DB',
	mapBoundary: '#F4F1EC',
	mapBoundaryStroke: '#D9534F',
	mapStreet: '#FFFFFF',
	mapStreetStroke: '#D0D6DF',
	mapBlockGrey: '#DDE2E9',
	mapGreen: '#D6EAD9',
	mapLabel: '#7A8290',
	mapPassageLabel: '#9A7A2E',
	statBannerBorder: '#88A4F2',
} as const

export const spacing = {
	1: 4,
	2: 8,
	3: 12,
	4: 16,
	6: 24,
} as const

export const radius = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	pill: 999,
} as const

export const size = {
	control: 48,
	controlLg: 52,
	tapMin: 44,
	screenWidth: 390,
	screenHeight: 844,
	tabBar: 72,
} as const

export const font = {
	regular: 'Inter_400Regular',
	medium: 'Inter_500Medium',
	semibold: 'Inter_600SemiBold',
	bold: 'Inter_700Bold',
	extrabold: 'Inter_800ExtraBold',
} as const

/** Вес шрифта в макете → семейство Inter. В RN семейство задаёт начертание. */
export function fontFamily(weight: 400 | 500 | 600 | 700 | 800) {
	switch (weight) {
		case 400:
			return font.regular
		case 500:
			return font.medium
		case 600:
			return font.semibold
		case 700:
			return font.bold
		case 800:
			return font.extrabold
	}
}

export const type = {
	display: { fontSize: 28, lineHeight: 34, fontFamily: font.bold, letterSpacing: -0.56 },
	title: { fontSize: 22, lineHeight: 28, fontFamily: font.bold, letterSpacing: -0.22 },
	heading: { fontSize: 17, lineHeight: 22, fontFamily: font.bold },
	body: { fontSize: 15, lineHeight: 21, fontFamily: font.regular },
	bodyStrong: { fontSize: 15, lineHeight: 21, fontFamily: font.semibold },
	caption: { fontSize: 13, lineHeight: 18, fontFamily: font.medium },
	overline: { fontSize: 12, lineHeight: 16, fontFamily: font.bold, letterSpacing: 0.96 },
} as const

export type Colors = typeof lightColors
