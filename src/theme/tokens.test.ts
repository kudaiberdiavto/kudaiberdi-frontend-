import { darkColors, fixed, lightColors, type Colors } from './tokens'

// Text must stay readable in both themes (WCAG AA: 4.5:1 for body text) — a token change that breaks it fails here.

function luminance(hex: string) {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
	return (hi + 0.05) / (lo + 0.05)
}

const PAIRS: [text: keyof Colors, background: keyof Colors][] = [
	['ink', 'surface'],
	['ink', 'card'],
	['inkSecondary', 'card'],
	['muted', 'surface'],
	['muted', 'card'],
	['brandStrong', 'card'],
	['brandStrong', 'brandTint'],
	['brandInk', 'brandTint'],
	['success', 'card'],
	['success', 'successSoft'],
	['danger', 'card'],
	['danger', 'dangerSoft'],
	['warningInk', 'warningSoft'],
	['warningInk', 'warningTint'],
	['violet', 'violetSoft'],
]

describe.each([
	['light', lightColors],
	['dark', darkColors],
] as const)('%s theme', (_, colors) => {
	it.each(PAIRS)('%s on %s ≥ 4.5:1', (text, background) => {
		expect(contrast(colors[text], colors[background])).toBeGreaterThanOrEqual(4.5)
	})

	it('white text on the brand button ≥ 4.5:1', () => {
		expect(contrast(fixed.white, colors.brand)).toBeGreaterThanOrEqual(4.5)
	})
})
