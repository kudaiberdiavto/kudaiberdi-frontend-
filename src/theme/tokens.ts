// Источник: design/tokens.json. Значения менять только вместе с макетом.
//
// Роли цветов (как в макетах design/specs):
//   brand   — главная кнопка экрана, одна на экран: отправить, опубликовать, написать, могу помочь, сохранить.
//   fill    — второстепенные кнопки: позвонить, маршрут, черновик, «Нет», «Не моё».
//   success — только статусы и подтверждения: «Есть», «Подходит», «Получено», включённый переключатель.
//             Не для кнопок — у Button / BigButton зелёного варианта нет.
//   danger  — ошибки и необратимое (удалить аккаунт).
//   fixed.whatsapp — только кнопка WhatsApp.
//   fixed.plate — только табличка места (ряд и контейнер): жёлтый всегда значит «идти сюда».

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
	// Not in tokens.json — they were hard-coded on the screens; here so the dark theme gets its own values.
	/** Solid pale green: «Вы ответили», «Есть», the active request dot. */
	successSoft: '#ECF8F0',
	/** Text on successTint («Подходит к вашей …»). */
	successInk: '#14532D',
	/** Solid pale red: «Нет в наличии». */
	dangerSoft: '#FDECEC',
	/** Yellow notes: «упакуйте», paused shop, courier terms. */
	warningSoft: '#FCEBB0',
	warningTint: '#FFF6E0',
	warningInk: '#7A5A00',
	/** Voice-filled («✓ Заполнили из голоса»). */
	violet: '#5B3FD1',
	violetSoft: '#F1ECFF',
	/** Text on brandTint. */
	brandInk: '#1D2B53',
	/** Neutral fills: secondary buttons, empty avatars, grey chips. */
	fill: '#EFEDEC',
	fillInk: '#7D7979',
	/** Empty photo slots. */
	placeholder: '#E1E6ED',
	dashed: '#BAB6B6',
	/** Dashed «add» outlines on blue-ish forms. */
	dashedBrand: '#B8C3D3',
	chevron: '#B8B4B4',
	toggleOff: '#BAB6B6',
	toggleOffKnob: '#9B9797',
	/** Dark pill on any surface: the toast. */
	inverse: '#201F1D',
	/** Round buttons and chips floating over photos (back, share, ♥) — icons on it use `ink`. */
	floating: 'rgba(255,255,255,0.92)',
	/** `surface` at zero opacity — the end of a fade into the screen. */
	surfaceClear: 'rgba(243,245,248,0)',
}

export const darkColors: typeof lightColors = {
	surface: '#111317',
	card: '#1B1E24',
	ink: '#F2F3F5',
	inkSecondary: '#C9CCD2',
	muted: '#9BA0A8',
	border: '#353A43',
	hairline: '#262A31',
	// tokens.json has #4C7BFF — white on it is 3.8:1, below AA for button labels; #3A6AF0 gives 4.7:1 and still 4:1
	// against the dark surface. To be confirmed with the designer and carried back into tokens.json.
	brand: '#3A6AF0',
	brandStrong: '#8AA8FF',
	brandTint: '#1A2442',
	success: '#4ADE80',
	successTint: 'rgba(74,222,128,0.14)',
	danger: '#F87171',
	dangerTint: 'rgba(248,113,113,0.14)',
	successSoft: '#173322',
	successInk: '#86EFAC',
	dangerSoft: '#3B1D1F',
	warningSoft: '#3A3113',
	warningTint: '#2A2414',
	warningInk: '#F2CF6B',
	violet: '#B4A3FF',
	violetSoft: '#272043',
	brandInk: '#C7D5FF',
	fill: '#262A31',
	fillInk: '#8B9099',
	placeholder: '#262A31',
	dashed: '#4A505A',
	dashedBrand: '#3A4A6B',
	chevron: '#5A606B',
	toggleOff: '#4A505A',
	toggleOffKnob: '#9BA0A8',
	inverse: '#2A2D33',
	floating: 'rgba(27,30,36,0.92)',
	surfaceClear: 'rgba(17,19,23,0)',
}

/** The same in both themes: on-accent white, media backdrops, brand gradients, third-party marks. */
export const fixed = {
	/** Text and icons on brand / success / danger and over photos and video. */
	white: '#FFFFFF',
	black: '#000000',
	/** Behind photos and video while they load. */
	media: '#1F2329',
	camera: '#0B0B0C',
	shadow: '#201F1D',
	/** Dark text on the camera's light chips. */
	inkOnLight: '#201F1D',
	mutedOnLight: '#605D5D',
	star: '#F5A623',
	whatsapp: '#25D366',
	/** Over the camera / video (always dark) — `danger` is too dark there. */
	recording: '#E5484D',
	flash: '#FFD54A',
	/** The toast's tick on the dark pill — `success` is too dark there. */
	live: '#22C55E',
	/** Link on the dark «Не нашли?» bar. */
	linkOnDark: '#8FB0FF',
	/**
	 * The place plate — row and container painted like the marking on the market's containers. The signature
	 * of the app: only the plate is this yellow, so yellow always means «go here». Same in both themes.
	 */
	plate: '#F2C230',
	plateInk: '#1A1A17',
	/** Labels on the plate («ряд», «конт.»). */
	plateMuted: '#5E4F12',
	/** The one brand gradient: home banners, the role screen, the master's profile header. */
	brandGradient: ['#2D63F0', '#1D46BF'] as [string, string],
	brandShadow: '#1D46BF',
	brandCard: '#1C44B8',
	cancelledGradient: ['#8C8888', '#6B6767'] as [string, string],
} as const

/** Схема рынка и пара мест из макетов: рисунок, одинаковый в обеих темах (как бумажная карта). */
export const raw = {
	sheetBackdrop: '#E4E2E0',
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

/**
 * Type scale — the sizes the screens actually use (the code runs ~1.5 px above the mockups, for reading on the market).
 * Use these, not numbers: `fontSize: fs.base`. Line height, where needed, ≈ size × 1.3.
 */
export const fs = {
	/** Badges on photos, the tab-bar counter. */
	xxs: 12,
	/** Small labels on chips and bubbles, timestamps. */
	xs: 13,
	/** Metadata, overlines, secondary lines. */
	sm: 14.5,
	/** Secondary text, chip and link labels. */
	md: 15.5,
	/** Body text, inputs. */
	base: 16.5,
	/** Card titles, list item names. */
	lg: 17.5,
	/** Button labels, emphasised lines. */
	xl: 18.5,
	/** Screen header titles. */
	xxl: 20,
	h3: 22,
	h2: 24,
	/** Tab screen titles («Чаты», «Запросы»). */
	h1: 26,
	/** Prices on a card's page. */
	display: 28,
	/** Big numbers: the price being typed, the SMS code title. */
	hero: 32,
} as const

/**
 * A section heading — sentence case, not the tracked ALL-CAPS overline («ИЩУ ДЛЯ МАШИНЫ» → «Ищу для машины»).
 * Colour at the call site: `{ ...sectionTitle, color: c.inkSecondary }`.
 */
export const sectionTitle = { fontSize: fs.base, fontFamily: font.bold, letterSpacing: -0.1 } as const

export type Colors = typeof lightColors
